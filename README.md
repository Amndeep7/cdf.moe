# redditthreadinspector
Makes graphs from comments on Reddit threads

## Preparing for the data
- Install [poetry](https://python-poetry.org/docs/)
- Install and initialize [postgres](https://www.postgresql.org/)
- Install [psycopg2's dependencies](http://initd.org/psycopg/docs/install.html#build-prerequisites)
- Fill out the info needed in .env.example and rename it to .env
- Run `poetry install`

## Acquiring the data
- Pick a reddit thread and grab the thread ID: https://www.reddit.com/r/subreddit/comments/thread_id/title/otherstuffsometimes
- Run `acquire.js` like so: `node acquire.js thread_id`

## Viewing the data
- Visit [cdf.moe](https://cdf.moe)

## Other stuff
- Issues and PRs welcome, particularly for adding on graph types

----

## Interesting queries
### Ranking users over number of comments made
```sql
select rank() over (order by count desc), author, count from (select author, count(author) from comments inner join threads on link_id = long_id where short_id='short_name_for_thread' group by author order by count desc) x;
```
### Seeing which users received the most replies
```sql
with t1 as (select parent_id, count(*) as c from comments inner join threads on link_id = long_id where short_id = 'short_name_for_thread' and link_id != parent_id group by parent_id),
t2 as (select author, name from comments inner join threads on link_id = long_id where short_id = 'short_name_for_thread')
select t2.author, sum(t1.c) as s from t1, t2 where t1.parent_id = t2.name group by author order by s desc;
```
