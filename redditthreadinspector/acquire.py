from itertools import chain, zip_longest
from os import getenv
from pprint import pprint
from sys import argv

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
        elif comment_id not in id_map:
            print(comment_id, 'missing from dataset')
            return -1000
        else:
            cache[comment_id] = 1 + depth(id_map[comment_id]['parent_id'])
            return cache[comment_id]

    list(map(lambda comment: comment.update({'depth': depth(comment['id'])}), comments))


def acquire_comments(threadname):
    comments = get_comments(threadname)
    comments = list(map(lambda comment: comment.d_, comments))
    list(map(lambda comment: comment.update({'id': 't1_' + comment['id']}), comments))
    id_map = {c['id']: c for c in comments}
    add_depth(comments, id_map)
    return comments


def main():
    load_dotenv()

    threadname = argv[1]

    comments = acquire_comments(threadname)

    # pprint(comments)
    pprint(comments[-1])
    pprint(len(comments))

    '''
    connection = psycopg2.connect(f"dbname={getenv('DB_DATABASE')} user={getenv('DB_USER')}")
    cur = connection.cursor()
    cur.execute("SELECT * FROM threads limit 1;")
    print(cur.fetchone())
    connection.commit()
    cur.close()
    connection.close()
    '''


if __name__ == "__main__":
    main()
