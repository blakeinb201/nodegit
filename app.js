var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var hot = require('./routes/hot');
var twit = require('./routes/twit');
var trends = require('./routes/trends');

var initG = require('./routes/initParse');

var fs = require('fs');

var app = express();

GLOB = {};

// Map search density from google (used by /trends)
GLOB.gSearchCache = {};

// Hot and trending searches by area (country) from google (used by /initParse and /hot) 
GLOB.gHotTrendsCache = {};

// WOEID from yahoo, used for twitter geo search (used by /twit)
GLOB.WOEIDs = {};

// hot trending searches -global- (used by /hot)
GLOB.HEAT = {};

initG.cacheGHotness(function(data) {
	GLOB.gHotTrendsCache = data;
	gHotTrends = data;
	
	var HEAT = [];
	for(x in gHotTrends) {
		var biggest = null;
		for (y in gHotTrends[x]) {
			if (biggest == null) {
				biggest = gHotTrends[x][y];
			} else {
				if (biggest.trafficLowerBound < gHotTrends[x][y].trafficLowerBound) {
					biggest = gHotTrends[x][y];
				}
			}
		}
		HEAT.push(biggest);
	}
	
	HEAT.sort(function(a, b) {
		if (a.trafficLowerBound > b.trafficLowerBound) {
			return -1;
		} else if (b.trafficLowerBound > a.trafficLowerBound) {
			return 1;
		}
		return 0;
	});
	
	HEAT.splice(10);
	//HEAT = HEAT.slice(10);
	//console.log(Object.keys(topTen).length);
	//onsole.log(Object.keys(HEAT).length);
	
	GLOB.HEAT = HEAT;
	console.log("Trends ready!");
});




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/hot', hot);
app.use('/twit', twit);
app.use('/trends', trends);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;