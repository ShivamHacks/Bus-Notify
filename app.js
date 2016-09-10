var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(process.env.PORT || '3000', function () {
  console.log('Server started on port: ' + this.address().port);
});
app.get('/', function(req, res) {
  res.send('HELLO!');
});

// MAIN

var config = require('./config');
var twilio = require('twilio')(
  config.twilio_accountSID,
  config.twilio_authToken
);

app.post('/sms/incoming', function(req, res) {
  if (req.body) {
    var from = req.body.From;
    var body = req.body.Body;

    sendSMS(from, body);
  }
});

function sendSMS(to, message) {
  twilio.sendSms({
    to: to,
    from: config.twilio_phoneNumber,
    body: message
  }, function(error, message) {
    if (error) {
      console.log('SMS Error: Send');
      console.log(error);
    } else {
      console.log('SMS Success: Send');
      console.log(message);
    }
  });
}

module.exports = app;
