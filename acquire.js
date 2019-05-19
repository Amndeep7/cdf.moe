(async () => {
	try {
		require("dotenv").config();

		if (!process.argv[2]) {
			console.log(process.argv);
			throw "no thread argument";
		}

		const threadname = process.argv[2];

		const snoowrap = require("snoowrap");

		const r = new snoowrap({
			"userAgent": process.env.REDDIT_USERAGENT,
			"clientId": process.env.REDDIT_CLIENTID,
			"clientSecret": process.env.REDDIT_CLIENTSECRET,
			"refreshToken": process.env.REDDIT_REFRESHTOKEN,
		});

		r.config({
			"continueAfterRatelimitError": true,
			"requestDelay": 1200,
		});

		const thread = await r.getSubmission(threadname).expandReplies();
		// console.log(thread);
		console.log("got thread - num comments:", thread.num_comments, thread.comments.length);

		const { Pool } = require("pg");
		const pool = new Pool({
			"user": process.env.DB_USER,
			"password": process.env.DB_PASSWORD,
			"host": process.env.DB_HOST,
			"port": process.env.DB_PORT,
			"database": process.env.DB_DATABASE,
		});

		const res = await pool.query("Select $1::text as message", ["Hello World!"]);
		console.log(res.rows[0].message);

		const tablecreationthreads = await pool.query(`
			create table if not exists threads(
				id serial primary key,
				short_id char (6) not null,
				long_id char (9) not null unique 
			);`);
		const tablecreationcomments = await pool.query(`
			create table if not exists comments(
				id serial primary key,
				name char (10) not null unique,
				link_id char (9) not null,
				parent_id varchar (10) not null,
				author varchar (20) not null,
				depth int not null,
				score int not null,
				gid_1 int not null,
				gid_2 int not null,
				gid_3 int not null,
				body varchar (10000) not null,
				created_utc timestamptz not null,
				edited timestamptz
			);`);
		console.log("table creations", tablecreationthreads, tablecreationcomments);

		const insertthreadcommand = `
			insert into threads (short_id, long_id) values ($1, $2) on conflict (long_id) do nothing;
			`;
		const insertthreadvalues = [thread.id, thread.name];
		await pool.query(insertthreadcommand, insertthreadvalues);

		let tobeinsert = thread.comments.length;
		let completedinsert = 0;
		const recursive_insert = (c) => {
			// console.log(c.name, c.replies.length, typeof(c.gildings.gid_1));
			tobeinsert += c.replies ? c.replies.length : 0;
			const insertcommand = `
				insert into comments (name, link_id, parent_id, author, depth, score, gid_1, gid_2, gid_3, body, created_utc, edited)
				values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, to_timestamp($11) at time zone 'utc', to_timestamp($12) at time zone 'utc')
				on conflict (name)
				do update set (score, gid_1, gid_2, gid_3, body, edited) = ($6, $7, $8, $9, $10, to_timestamp($12) at time zone 'utc')
				where comments.name = $1;`;
			const insertvalues = [c.name, c.link_id, c.parent_id, c.author.name, c.depth, c.score, typeof(c.gildings.gid_1) === "number" ? c.gildings.gid_1 : 0, typeof(c.gildings.gid_2) === "number" ? c.gildings.gid_2 : 0, typeof(c.gildings.gid_3) === "number" ? c.gildings.gid_3 : 0, c.body, c.created_utc, c.edited ? c.edited : null];
			pool.query(insertcommand, insertvalues).then(() => {
				completedinsert++;
			});
			c.replies.forEach((comment) => recursive_insert(comment));
		};
		thread.comments.forEach(recursive_insert);

		await (() => new Promise((resolve, reject) => {
			const wait = () => {
				if (completedinsert === tobeinsert) {
					resolve();
				} else {
					console.log(completedinsert, tobeinsert);
					setTimeout(wait, 100);
				}
			};
			wait();
		}))();

		await pool.end();

	} catch (e) {
		console.log("err", e);
	}
})();
