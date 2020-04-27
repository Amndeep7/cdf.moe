# redditthreadinspector
Makes graphs from comments on Reddit threads

## Preparing for the data
- Install [Docker](https://www.docker.com/)
- Fill out the info needed in .env.example and rename it to .env
- Run `docker-compose up` to start everything up
  - Will need to use the `--build` option to make it not use a cached image when you wanna update the image
  - Use the `-d` option to leave it always running in a detached state

## Acquiring the data
- Pick from one of three options to acquire data:
  - `--threads` grabs the threads from the given thread IDs
    - To get a thread ID, pick a reddit thread and find it in the URL: https://www.reddit.com/r/subreddit/comments/thread_id/title/otherstuffsometimes
  - `--cdf` grabs the most recently completed [CDF](https://old.reddit.com/r/anime/search?q=title%3A%22Casual+Discussion+Fridays%22+author%3AAnimeMod&restrict_sr=on&sort=new&t=week)
  - `--all` grabs all previous FTFs and CDFs (including the one that's currently in progress)
- Run:
  1) `docker exec -it redditthreadinspector_acquire_1 /bin/bash`
  2) `poetry run python3 acquire.py --OPTION`
  3) Wait potentially quite a while or a few seconds-minutes for it to run depending on which option you chose
- The default behavior is to automatically run the `--cdf` option on a weekly basis

## Viewing the data
- If you wanna see the raw data, run `docker exec -it redditthreadinspector_db_1 psql -U YOUR_POSTGRES_USER THE_DB_DATABASE`
- Visit [cdf.moe](https://cdf.moe) for fancy graphs for CDF

## Other stuff
- Issues and PRs welcome, particularly for adding on graph types
- This is very much due to a local configuration setup, but you're going to have to also set up an external docker network
  - Run `docker network create rti_nginx`

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
