require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
});

router.get('/', (_req, res) => {
  res.json({ test: 'contents' });
});

router.get('/lmao', (_req, res) => {
  res.json({ ayy: 'lmao' });
});

router.get('/sanity', async (_req, res) => {
  const msg = await pool.query('select $1::text as message, NOW() as now', ['Hello World!']);
  res.json(msg.rows);
});

module.exports = router;
