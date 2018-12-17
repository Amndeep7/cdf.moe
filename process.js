(async () => {
	try {
		require("dotenv").config();

		if (!process.argv[2]) {
			console.log(process.argv);
			throw "no thread argument";
		}

		if (!process.argv[3]) {
			console.log(process.argv);
			throw "need at least one graph type";
		}

		const threadname = process.argv[2];
		let graphs = process.argv.slice(3);

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

		const d3nBar = require("d3node-barchart");
		const d3nLine = require("d3node-linechart");
		const output = require("d3node-output");

		const createGraph = (name, title, type, data, constructorArgs={}) => {
			const bar = type({...{
				"data": data,
				"container": `<div id="container"><h2>${title}</h2><div id="chart"></div></div>`,
				"width": 1280,
				"height": 670,
			}, ...constructorArgs});
			// console.log(bar.svgString());

			output(name, bar, { "width": 1280, "height": 720 });
		};

		if(graphs[0] === "all") {
			graphs = ["commentsperday", "commentsperhour", "commentsperuser", "commentsperuserhistogram", "commentsperuserdecile", "parentsvschildrenperhoureachday", "cdf"];
		}
		for (let i = 0; i < graphs.length; i++) {
			switch(graphs[i]) {
			case "commentsperday":
				const commentsperday = await pool.query(`select count(*)::int as value, to_char(date(created_utc), 'Day') as key from comments inner join threads on link_id = long_id where short_id='${threadname}' group by date(created_utc) order by date(created_utc);`);
				commentsperday.rows[commentsperday.rows.length-1].key = "Next Friday";
				console.log(commentsperday.rows);
				createGraph(`commentsperday_${threadname}`, "Comments per day", d3nBar, commentsperday.rows);
				break;
			case "commentsperhour":
				const commentsperhour = await pool.query(`select count(*)::int as value, extract(hour from created_utc)::int as key from comments inner join threads on link_id = long_id where short_id='${threadname}' group by extract(hour from created_utc) order by key;`);
				console.log(commentsperhour.rows);
				createGraph(`commentsperhour_${threadname}`, "Cumulative sum of comments per hour", d3nBar, commentsperhour.rows);
				break;
			case "commentsperuser":
				const commentsperuser = await pool.query(`select row_number() over (order by commentcount desc) as key, commentcount::int as value from (select count(*) as commentcount from comments inner join threads on link_id = long_id where short_id='${threadname}' group by author) as temp;`);
				commentsperuser.rows = commentsperuser.rows.map((row) => { return { "key": parseInt(row.key), "value": row.value } });
				console.log(commentsperuser.rows);
				createGraph(`commentsperuser_${threadname}`, "Number of comments per (anonymized) user", d3nBar, commentsperuser.rows);
				break;
			case "commentsperuserhistogram":
				const commentsperuserhistogram = await pool.query(`with temp1 as (select count(*) as commentcount from comments inner join threads on link_id = long_id where short_id='${threadname}' group by author) select width_bucket(commentcount, min, max+1, 10) as buckets, int8range(min(commentcount), max(commentcount), '[]') as key, count(*)::int as value from temp1, (select min(commentcount), max(commentcount) from temp1) as temp2 group by buckets order by buckets;`);
				console.log(commentsperuserhistogram.rows);
				createGraph(`commentsperuserhistogram_${threadname}`, "Histogram of number of comments per user", d3nBar, commentsperuserhistogram.rows);
				break;
			case "commentsperuserdecile":
				const commentsperuserdecile = await pool.query(`select ntile, avg(commentcount)::double precision as value, min(commentcount), max(commentcount), int8range(min(commentcount), max(commentcount), '[]') as key from (select commentcount, ntile(10) over (order by commentcount) as ntile from (select count(*) as commentcount from comments inner join threads on link_id = long_id where short_id='${threadname}' group by author) as temp1) as temp2 group by ntile order by ntile;`);
				console.log(commentsperuserdecile.rows);
				createGraph(`commentsperuserdecile_${threadname}`, "Decile chart of number of comments per user (showcasing the average for each decile)", d3nBar, commentsperuserdecile.rows);
				break;
			case "parentsvschildrenperhoureachday":
				const parentsvschildrenperhoureachday = await pool.query(`select to_char(created_utc, 'YYYY-MM-DD-HH24') as date, sum(case when link_id=parent_id then 1 else 0 end)::int as parents, sum(case when link_id!=parent_id then 1 else 0 end)::int as children from comments inner join threads on link_id = long_id where short_id='${threadname}' group by date order by date;`);
				const pvc = [parentsvschildrenperhoureachday.rows.map(row => ({"key": new Date(...row.date.split("-")), "value": row.parents})), parentsvschildrenperhoureachday.rows.map((row) => ({"key": new Date(...row.date.split("-")), "value": row.children}))];
				pvc["allKeys"] = parentsvschildrenperhoureachday.rows.map((row) => new Date(...row.date.split("-")));
				console.log(pvc);
				createGraph(`parentsvschildrenperhoureachday_${threadname}`, "Parents vs children comments per hour each day (ignore that the axis is in ms from the epoch)", d3nLine, pvc, {"lineColors": ['steelblue', 'darkorange']});
				break;
			case "cdf":
				const tname = await pool.query(`select long_id from threads where short_id='${threadname}'`);
				const parents = await pool.query(`select parent_id, name from comments inner join threads on link_id = long_id where short_id='${threadname}' order by created_utc`);
				const depths = {};
				for (let j = 0; j < parents.rows.length; j++) {
					if(parents.rows[j].parent_id === tname.rows[0].long_id) {
						depths[parents.rows[j].name] = 1;
					} else {
						depths[parents.rows[j].name] = 1 + depths[parents.rows[j].parent_id];
					}
				}
				const depthvalues = Object.values(depths);
				const freqdepths = [0];
				for (let j = 0; j < depthvalues.length; j++) {
					if(freqdepths[depthvalues[j]]) {
						freqdepths[depthvalues[j]]++;
					} else {
						freqdepths[depthvalues[j]] = 1;
					}
				}
				for (let j = 1; j < freqdepths.length; j++) {
					freqdepths[j] += freqdepths[j-1];
				}
				console.log(freqdepths);
				const cdf = freqdepths.map((d,i) => ({ "key": i, "value": d/depthvalues.length }));
				createGraph(`cdf_${threadname}`, "CDF (depth of comments vs percent of comments at or below that depth)", d3nLine, cdf);
				break;
			default:
				console.log("No handler for", graphs[i]);
			}
		}

		await pool.end();

	} catch (e) {
		console.log("err", e);
	}
})();
