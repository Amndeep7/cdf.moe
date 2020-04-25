const express = require('express');
const logger = require('morgan');

const api = require('./api/api');

const app = express();

app.use(logger('dev'));

app.use('/api', api);

module.exports = app;
