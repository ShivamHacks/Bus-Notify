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

var config = require('./config');
var twilio = require('twilio')(
  config.twilio_accountSID,
  config.twilio_authToken
);

twilio.sendSms({
    to:'+17322669350',
    from: config.twilio_phoneNumber,
    body:'ahoy hoy! Testing Twilio and node.js'
}, function(error, message) {
    if (!error) {
        console.log('Success! The SID for this SMS message is:');
        console.log(message.sid);
        console.log('Message sent on:');
        console.log(message.dateCreated);
    } else {
        console.log('Oops! There was an error.');
        console.log(error);
    }
});

app.post('/sms/incoming', function(req, res) {
  console.log('got message');
  if (twilio.validateExpressRequest(req, config.twilio_authToken)) {
    var twiml = new twilio.TwimlResponse();
    //twiml.say('Hi!  Thanks for checking out my app!');
    twiml.say(JSON.stringify(req.body));
    res.type('text/xml');
    res.send(twiml.toString());
  } else {
    res.send('you are not twilio.  Buzz off.');
  }
});

module.exports = app;
