const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  res.json({ test: 'contents' });
});

router.get('/lmao', function(req, res) {
  res.json({ ayy: 'lmao' });
});

module.exports = router;
