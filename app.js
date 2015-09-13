var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// The actual libraries I used
var routes = require('./routes/index');
var hot = require('./routes/hot');
var twit = require('./routes/twit');
var trends = require('./routes/trends');
var initG = require('./routes/initParse');


var app = express();


// GLOB or GLobal OBject is to cache results for faster access and less straint on the api providers
GLOB = {};

// Map search density from google (used by /trends)
GLOB.gSearchCache = {};

// Hot and trending searches by area (country) from google (used by /initParse and /hot)
GLOB.gHotTrendsCache = {};

// WOEID from yahoo, used for twitter geo search (used by /twit)
GLOB.WOEIDs = {};

// Tweets from twitter search (used by /twit)
GLOB.twits = {};

// hot trending searches -global- (used by /hot)
GLOB.HEAT = {};

//initG.cacheGHotness(filterTrends);

// update trends every hour
getNewTrends();
setInterval(getNewTrends, 3600000);

function getNewTrends() {
	initG.cacheGHotness(filterTrends);
}

// filter and sort the trends by search volume
function filterTrends(data) {
	// Save the data for global use
	GLOB.gHotTrendsCache = data;
	gHotTrends = data;
	
	var HEAT = [];
	
	// Extract the largest search from each place
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
	
	// Sort the results 
	HEAT.sort(function(a, b) {
		if (a.trafficLowerBound > b.trafficLowerBound) {
			return -1;
		} else if (b.trafficLowerBound > a.trafficLowerBound) {
			return 1;
		}
		return 0;
	});
	
	// get the top 15 trends
	HEAT.splice(15);
	
	// Sort the country trends
	for(y in GLOB.gHotTrendsCache) {
		GLOB.gHotTrendsCache[y].sort(function(a, b) {
			if (a.trafficLowerBound > b.trafficLowerBound) {
			return -1;
			} else if (b.trafficLowerBound > a.trafficLowerBound) {
				return 1;
			}
			return 0;
		});
	}
	
	GLOB.HEAT = HEAT;
	console.log("Trends ready!");
}




///////////////////////////////// It's junk /////////////////////////////////

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