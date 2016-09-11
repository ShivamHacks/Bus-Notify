






























/*

need to say that 'your stop is next' - harder b/c need to know stops
and that bus will be here in 2 mins - easier

*/

// Params: routeID, stopNum, message
// This function updates students on bus route status.
// (only the students that should know)


//console.log(distance(38.898556, -77.037852, 38.897147, -77.043934));











// Don't really need it

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
    // telling us which stop
    if (!isNaN(body)) {
      var stopNum = parseInt(body);
      console.log(stopNum);
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










app.get('/api/getUserLocation', function(req, res) {
  res.render('getLocation', {
    userID: 'asdasdsa'
  });
});
app.post('/api/setUserLocation', function(req, res) {
  console.log(req.body);
});


        /*var firstStop;
        distance.get({
          origin: '',
          destination: 'San Diego, CA'
        }, function(err, data) {
          if (err) return console.log(err);
          console.log(data);
        });

        var stopNum = stops.indexOf(calculateNearest(doc.stops, currLoc));
        db.students.find({
          route: routeID,
          stop: parseInt(stopNum)
        }, function(err, docs) {
          console.log(docs);
          _.each(docs, function(doc) {
            if (doc != null && doc != {})
              sendSMS(doc.number, 'Your stop is coming up soon.');
            // need to fix this ^ to be more detailed
          });
        });*/



// but it's not by nearest, its by location
function calculateNearest(stops, currentLoc) {
  _.sortBy(stops, function(stop) {
    // Times -1 because smallest distance is what we want
    return distance(stop.lat, stop.lng, currentLoc.lat, currentLoc.lng) * -1;
  });
  return stops[0];
}

// Params: busID, newLat, newLng
app.get('/api/updateLocationasd', function(req, res) {
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
});


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