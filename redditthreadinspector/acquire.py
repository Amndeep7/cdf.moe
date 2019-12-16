from datetime import datetime, timezone
from itertools import chain, zip_longest
from os import getenv
from pprint import pprint
from sys import argv, exc_info

from dotenv import load_dotenv
from psaw import PushshiftAPI
import psycopg2


def get_comments(threadname):
    api = PushshiftAPI()
    gen_comment_ids = api._get_submission_comment_ids(submission_id=threadname)
    batched_comment_ids = list(zip_longest(*([iter(gen_comment_ids)]*500)))
    batched_comment_ids[-1] = tuple(filter(lambda x: x, batched_comment_ids[-1]))
    comments = list(chain.from_iterable(map(lambda batch: api.search_comments(ids=batch, limit=len(batch)),
                                        batched_comment_ids)))
    return comments


def add_depth(comments, id_map):
    cache = {comments[0]['link_id']: 0}

    def depth(comment_id):
        if comment_id in cache:
            return cache[comment_id]
        elif comment_id not in id_map:  # this should never happen but something's up with pushshift
            print(comment_id, 'missing from dataset')
            return -1000
        else:
            cache[comment_id] = 1 + depth(id_map[comment_id]['parent_id'])
            return cache[comment_id]

    list(map(lambda comment: comment.update({'depth': depth(comment['id'])}), comments))


def acquire_comments(threadname):
    comments = get_comments(threadname)
    # you get comments as attributes and a dictionary, so keeping only the dict
    comments = list(map(lambda comment: comment.d_, comments))
    # you get the ids without their header of 't1_' so adding that back in to make it match up with parent_id
    list(map(lambda comment: comment.update({'id': 't1_' + comment['id']}), comments))
    # convert raw ms from epoch to datetime objects with tz of utc so it happens on this side instead of sql side
    list(map(lambda comment: comment.update({'created_utc': datetime.fromtimestamp(comment['created_utc'],
                                            timezone.utc)}), comments))
    id_map = {c['id']: c for c in comments}
    add_depth(comments, id_map)
    return comments


def ingest_comments(comments):
    connection = psycopg2.connect(f"dbname={getenv('DB_DATABASE')} user={getenv('DB_USER')}")
    cur = connection.cursor()

    cur.execute('select %s::text;', ['hello world'])
    print(cur.fetchone())

    cur.execute('''
        create table if not exists commentsv2(
            commentid serial primary key,
            author text,
            body text,
            created_utc timestamptz,
            depth int,
            id text unique,
            link_id text,
            parent_id text
        );''')

    for c in comments:
        try:
            cur.execute('''
                insert into commentsv2 (author, body, created_utc, depth, id, link_id, parent_id)
                values (%s, %s, %s, %s, %s, %s, %s)
                on conflict (id)
                do update set (body, depth) = (excluded.body, excluded.depth);
                ''',
                        [c['author'], c['body'], c['created_utc'], c['depth'], c['id'], c['link_id'], c['parent_id']])
        except:  # noqa: E722
            pprint(c)
            print('Error:', exc_info()[0])

    connection.commit()

    # sanity check
    cur.execute('select * from commentsv2 limit 1;')
    print(cur.fetchone())
    cur.execute('select count(*) from commentsv2 where link_id=%s;', [c['link_id']])
    print(cur.fetchone())

    connection.commit()
    cur.close()
    connection.close()


def main():
    load_dotenv()
    threadname = argv[1]
    comments = acquire_comments(threadname)
    # pprint(comments)
    pprint(comments[-1])
    pprint(len(comments))
    ingest_comments(comments)


if __name__ == "__main__":
    main()
