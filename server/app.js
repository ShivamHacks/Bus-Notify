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

app.get('/', function(req, res) {
  res.send('HELLO');
});

// MAIN
var shortid = require('randomstring');

var config = require('./config');
var twilio = require('twilio')(config.twilio_accountSID, config.twilio_authToken);
var _ = require('underscore');

var Datastore = require('nedb')
var db = {
  routes: new Datastore({ filename: 'db/routes.db', autoload: true }),
  students: new Datastore({ filename: 'db/students.db', autoload: true })
};


app.get('/createNewRoute', function(req, res) {
  res.render('location', {});
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


app.get('/api/getMap', function(req, res) {
  var routeID = req.query.routeID;
  console.log(routeID);
  db.routes.findOne({ routeID: routeID }, function(err, doc) {
    console.log(doc);
    if (!err) {
      if (doc == null || doc == {}) {
        db.routes.insert({
          routeID: shortid.generate({ length: 5, charset: 'numeric' }),
          stops: [],
          lastStop: -1
        }, function(err, doc) {
          if (!err) {
            res.send(JSON.stringify({ 
              newMap: true,
              routeID: doc.routeID
            }));
          }
        });
      } else { 
        res.send(JSON.stringify({
          newMap: false,
          stops: doc.stops
        })); 
      }
    }
    else res.send('Error');
  })
});


app.post('/api/addStops', function(req, res) {
  var routeID = req.body.routeID;
  var stops = JSON.parse(req.body.stops);
  for (var i = 0; i < stops.length; i++) {
    stops[i].members = [];
  }
  db.routes.update({
    routeID: routeID
  }, {
    $push: { 
      stops: { $each: stops }
    }
  }, {}, function() {});
});


app.post('/api/addMember', function(req, res) {
  var routeID = req.body.routeID;
  var stopNum = req.body.stop;
  var number = req.body.number;

  db.students.update({
    number: number
  }, {
    number: number,
    stopNum: stopNum,
    routeID: routeID
  }, {
    upsert: true
  }, function() {});

  res.status(200);
  res.send('All Good');
});


var mapsDistance = require('google-distance');
var schedule = require('node-schedule');

app.get('/api/updateLocation', function(req, res) {

  var routeID = req.query.routeID;
  var moving = req.query.moving;
  var currLoc = {
    lat: req.query.lat,
    lng: req.query.lng
  };

  db.routes.findOne({
    routeID: routeID
  }, function(err, doc) {
    if (!err) {
      if (doc != null && doc != {}) {

        if (!moving && isNear(doc.stops[doc.lastStop+1], currLoc)) {
          // TODO: set lastStop = -1, and reset 
          // it is on a stop

          // send update to students
          db.students.find({
            routeID: routeID,
            stop: doc.stops[doc.lastStop+1].stopNum
          }, function(err, docs) {
            if (!err) {
              _.each(docs, function(doc) {
                sendSMS(doc.number, 'Your bus is here!');
              });
            }
          });

          // update last stop
          if (doc.lastStop + 1 == doc.stops.length) {
            db.routes.update({
              routeID: routeID
            }, {
              $set: { lastStop: -1 }
            }, {}, function() {});
          } else {
            db.routes.update({
              routeID: routeID
            }, {
              $set: { lastStop: doc.lastStop+1 }
            }, {}, function() {});
          }

        } else {

          // see when to send text
          mapsDistance.get({
            origin: currLoc.lat + ',' + currLoc.lng,
            destination: doc.stops[doc.lastStop+1].lat + ',' + doc.stops[doc.lastStop+1].lng
          }, function(err, data) {
            if (err) return console.log(err);
            else {
              var duration = data.durationValue;
              if (durationValue < 120) {
                for (var i = 0; i < doc.members.length; i++) {
                  sendSMS(doc.members[i], 'Your bus will be here in under 2 mins!');
                }
              } else {
                var date = new Date(Date.now() + (data.durationValue * 1000) - 120000);
                var j = schedule.scheduleJob(date, function(){
                  sendSMS(doc.members[i], 'Your bus will be here in under 2 mins!'); 
                });
              }
            }
          });
        }

      }
    }
  });

  res.status(200);
  res.send('All good');

});


function isNear(coord1, coord2) {
  var eplison = 100; // 100m
  var d = distance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
  if (eplison * -1 < d || d < eplison) return true;
  else return false;
}

function distance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = (lat2 - lat1) * (Math.PI / 180);
  var dLon = (lon2 - lon1) * (Math.PI / 180);
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) 
  + Math.sin(dLon/2) * Math.sin(dLon/2) 
  * Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))) * 1000; // in meters
}


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

module.exports = app;
