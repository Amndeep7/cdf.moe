from argparse import Action, ArgumentParser
from datetime import datetime, timezone
from itertools import chain, zip_longest
from os import getenv
from pprint import pprint
from sys import exc_info
import traceback

from dotenv import load_dotenv
from psaw import PushshiftAPI
import psycopg2


class CDFAction(Action):
    def __init__(self, option_strings, dest, nargs=None, **kwargs):
        if nargs is not None:
            raise ValueError("nargs not allowed")
        super(CDFAction, self).__init__(option_strings, dest, nargs=0, **kwargs)

    def __call__(self, parser, namespace, values, option_string=None):
        api = PushshiftAPI()
        cdf = list(api.search_submissions(limit=2, subreddit='anime', author='AnimeMod', filter=['id'],
                                          q='Casual Discussion Fridays'))[-1].id
        setattr(namespace, self.dest, [cdf])


class AllAction(Action):
    def __init__(self, option_strings, dest, nargs=None, **kwargs):
        if nargs is not None:
            raise ValueError("nargs not allowed")
        super(AllAction, self).__init__(option_strings, dest, nargs=0, **kwargs)

    def __call__(self, parser, namespace, values, option_string=None):
        api = PushshiftAPI()
        cdfs = list(api.search_submissions(subreddit='anime', filter=['id'],
                    q='"This is a weekly thread to get to know"'))
        ftfs = list(api.search_submissions(subreddit='anime', filter=['id'],
                    q='"A weekly thread to talk about... Anything!"'))
        setattr(namespace, self.dest, map(lambda submission: submission.id, [*cdfs, *ftfs]))


def parse_args():
    parser = ArgumentParser(description='Ingests Reddit comments')
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--cdf', action=CDFAction,
                       help='use the second most recently posted CDF\'s id as the specified thread id')
    group.add_argument('--threads', nargs='+', help='use the specified thread ids')
    group.add_argument('--all', action=AllAction, help='use all the CDF and FTF thread ids as the specified thread ids')
    args = parser.parse_args()
    pprint(args)
    return args


def get_comments(threadname):
    api = PushshiftAPI()
    gen_comment_ids = api._get_submission_comment_ids(submission_id=threadname)
    batched_comment_ids = list(zip_longest(*([iter(gen_comment_ids)]*500)))
    if len(batched_comment_ids) == 0:  # pushshift sometimes is missing data
        print('missing data in', threadname)
        return []
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
    if len(comments) == 0:
        return []
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
    connection = psycopg2.connect(f"dbname={getenv('DB_DATABASE')} user={getenv('DB_USER')} host={getenv('DB_HOST')} password={getenv('DB_PASSWORD')}")  # noqa: E501
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
            print('failed in db ingestion')
            pprint(c)
            print('Error:', exc_info())
            traceback.print_exc()

    connection.commit()

    # sanity check
    cur.execute('select * from commentsv2 where link_id=%s limit 1;', [c['link_id']])
    print(cur.fetchone())
    cur.execute('select count(*) from commentsv2 where link_id=%s;', [c['link_id']])
    print(cur.fetchone())

    connection.commit()
    cur.close()
    connection.close()


def main():
    try:
        load_dotenv()
        args = parse_args()
        threads = list(args.threads or args.cdf or args.all)
        print(threads)
        print(len(threads))
        for threadname in threads:
            pprint(threadname)
            comments = acquire_comments(threadname)
            # pprint(comments)
            pprint(comments[-1] if len(comments) > 0 else 'no comments')
            pprint(len(comments))
            if len(comments) > 0:
                ingest_comments(comments)
    except:  # noqa: E722
        print('failed at something')
        print('Error:', exc_info())
        traceback.print_exc()


if __name__ == "__main__":
    main()
