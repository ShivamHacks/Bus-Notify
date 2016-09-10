var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));

app.listen(process.env.PORT || '3000', function () {
  console.log('Server started on port: ' + this.address().port);
});

var shortid = require('randomstring');

app.get('/', function(req, res) {
  res.send('HELLO');
});

// MAIN

var config = require('./config');
var twilio = require('twilio')(
  config.twilio_accountSID,
  config.twilio_authToken
  );
var _ = require('underscore');

app.get('/api/getUserLocation', function(req, res) {
  res.render('getLocation', {
    userID: 'asdasdsa'
  });
});
app.post('/api/setUserLocation', function(req, res) {
  console.log(req.body);
});

var Datastore = require('nedb')
var db = {
  buses: new Datastore({ filename: 'db/buses.db', autoload: true }),
  routes: new Datastore({ filename: 'db/routes.db', autoload: true }),
  students: new Datastore({ filename: 'db/students.db', autoload: true })
}


app.get('/createNewRoute', function(req, res) {
  res.render('location', {
    routeID: shortid.generate({ length: 5, charset: 'numeric' })
  });
})

// Params: stops, routeID
app.get('/api/createNewRoute', function(req, res) {
  var stops = JSON.parse(req.query.stops || null);
  var routeID = req.query.routeID || null;

  db.routes.insert({
    routeID: routeID,
    stops: stops
  }, function (err, newDoc) {
    console.log(newDoc);
  });

  res.status(200);
  res.send('All Good');
});

// Params: busID, newLat, newLng
app.get('/api/updateLocation', function(req, res) {
  var routeID = req.query.routeID || 'noRouteID';
  var currentLoc = {
    lat: req.query.lat || 0,
    lng: req.query.lng || 0
  }

  db.routes.findOne({
    busID: busID
  }, function(err, doc) {
    var nearest = calculateNearest(doc.stops, currentLoc);
    db.students.find({
      stop: nearest.name
    }, function(err, docs) {
      _.each(docs, function(doc) {
        sendSMS(doc.number, 'Your stop is next.');
        // todo: calculate time; how long it will take bus
      });
    });
  });
})

// but it's not by nearest, its by location
function calculateNearest(stops, currentLoc) {
  _.sortBy(stops, function(stop) {
    // Times -1 because smallest distance is what we want
    return distance(stop, currentLoc) * -1;
  });
  return stops[0];
}

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = 
  0.5 - Math.cos(dLat)/2 + 
  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
  (1 - Math.cos(dLon))/2;

  return R * 2 * Math.asin(Math.sqrt(a));
}




var commands = {
  join: 'join %param%',
};

function parseBody(from, body) {
  if (body.indexOf('join') == 0) {
    // joining route
    var routeCode = body.substring('join '.length);
    db.routes.findOne({
      routeID: routeCode
    }, function(err, doc) {
      if (err) { sendSMS(from, 'An error occured'); }
      else {
        if (doc != null && doc != {}) {
          var message = '';
          _.each(doc.stops, function(stop, index) {
            message += (index+1) + '. ' + stop.title + '\n';
          })
          sendSMS(from, message);
          db.students.insert({
            route: routeCode,
            number: from
          }, function(err, newDoc) {
            console.log(newDoc);
          });
        } else { sendSMS(from, 'Incorrect code'); }
      }
    });
  } else {
    // save student number, route, and stop index. Then when we figure out which stop is closest, then 
    // we can just look for students with that route & that stop, and text them.
    sendSMS(from, 'lol');
    // telling us which stop
    if (!isNan(body)) {
      var stopNum = parseInt(body);
      db.students.findOne({
        number: from
      }, function(err, doc) {
        if (err) { sendSMS(from, 'An error occured'); }
        else {
          db.students.update({
            number: from
          }, {
            $set: {
              stop: stopNum
            }
          }, {}, function() {});
          sendSMS(from, 'Success! You will now recieve text updates when your bus is nearby.');
        }
      });
    } else {
      sendSMS(from, 'Sorry, could not recognize stop. Could you please put in the number of your stop?');
    }
    /*db.routes.findOne({
      routeID: routeCode
    }, function(err, doc) {
      if (err) { sendSMS(from, 'An error occured'); }
      else {
        var stop = doc.stops[parseInt(body)];
        db.students.insert({
          stop: stop
        }, function(err, newDoc) {
          if (err) sendSMS(from, 'An error occured');
          else sendSMS(from, 'Successfully recorded your stop as: ' + newDoc.stop);
        });
      }
    });*/
  }
}


app.post('/sms/incoming', function(req, res) {
  if (req.body) {
    var from = req.body.From;
    var body = req.body.Body.toLowerCase();

    parseBody(from, body);

  }
  res.status(200);
  res.send('All good');
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
      //console.log(message);
    }
  });
}






















// Params: busID, stopName, stopLat, stopLng
app.get('/api/addStop', function(req, res) {
  var busID = req.query.busID || 'noBusID';
  db.routes.update({
    busID: busID
  }, {
    $push: {
      stops: {
        name: req.query.stopName || 'noStopName',
        lat: req.query.stopLat || 0,
        lng: req.query.stopLng || 0
      }
    }
  }, {}, function() {});
});

module.exports = app;
