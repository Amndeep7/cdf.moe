const express = require('express');
const logger = require('morgan');

const api = require('./routes/api');

const app = express();

app.use(logger('dev'));

app.use('/api', api);

module.exports = app;
