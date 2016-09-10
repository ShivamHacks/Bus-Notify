var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();

app.listen(process.env.PORT || '3000', function () {
  console.log('Server started on port: ' + this.address().port);
});

app.get('/', function(req, res) {
  res.send('HELLO!');
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

module.exports = app;
