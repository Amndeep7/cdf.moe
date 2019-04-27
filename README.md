# redditthreadinspector
Makes graphs from comments on threads using Postgres and Node

## Preparing for the data
- Install node
- Install and initialize postgres
- Fill out the info needed in .env.example and rename it to .env
- Run `npm install`

## Acquiring the data
- Pick a reddit thread and grab the thread ID: https://www.reddit.com/r/subreddit/comments/thread_id/title/otherstuffsometimes
- Run `acquire.js` like so: `node acquire.js thread_id`
- Wait a bit over a minute for every thousand comments

## Processing the data
- Pick a reddit thread that you've already acquired the data for and grab the thread ID
- Pick the types of graphs you want; read the code to see what types there are - the names you need to use are the cases for the switch statement
- Run `process.js` like so: `node process.js thread_id listofall thegraphtypes youwanttouse`
- Wait a far shorter amount of time

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
