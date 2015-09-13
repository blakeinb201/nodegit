var express = require('express');
var router = express.Router();

var http = require('http');
var Twitter = require('twitter');
var querystring = require('querystring');


/*

var client = new Twitter({
	consumer_key: 'MQwEJdZrpkdEYzrk67bYWpTez',
	consumer_secret: 'jU2thpOFhCyuFimdUrsxjopyXIVgm55Pts85CdFajEYBFyzk0R',
	access_token_key: '',
	access_token_secret: ''
});

//http://where.yahooapis.com/v1/places.q('AU-QLD')?appid=dj0yJmk9T0tZZ0JhRW1hb0FnJmQ9WVdrOVJVMHhNbXQxTlRBbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1iMA--

client.get('trends/place', {id: 1}, function(error, tweets, response){
	if(error) throw error;
	console.log(tweets);  // The favorites. 
	//console.log(response);  // Raw response object. 
});
*/

// app.local.something
/* GET home page. */
router.get('/', function(req, res, next) {
	//res.render('index', { title: 'HAPPENING time' });
	
	var response = {};
	if (typeof req.query === 'undefined') {
		response = {error: "Invalid parameters"};
		res.json(response);
		return;
	}
	
	if ((typeof req.query['geo'] === 'undefined') || (typeof req.query['q'] === 'undefined')) {
		response = {error: "Invalid parameters"};
		res.json(response);
		return;
	}
	
	if ((req.query['geo'] == '') || (req.query['q'] == '')) {
		response = {error: "Invalid query"};
		res.json(response);
		return;
	}
	
	var geoQuery = querystring.escape(req.query['geo']);
	var tweetQuery = querystring.escape(req.query['q']);
	
	if (typeof GLOB.WOEIDs[geoQuery] === 'undefined') {
		var apiKey = 'dj0yJmk9T0tZZ0JhRW1hb0FnJmQ9WVdrOVJVMHhNbXQxTlRBbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1iMA--';
		
		var fullQuery = "/v1/places.q('" + geoQuery + "')?format=json&appid=" + apiKey;
		
		var options = {
			host: 'where.yahooapis.com',
			path: fullQuery
		};

		var getIt = http.get(options, function(re) {
			console.log('STATUS: ' + res.statusCode);
			//console.log('HEADERS: ' + JSON.stringify(res.headers));
			var bodyChunks = [];
			re.on('data', function(chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				
				var jsonWOEID = JSON.parse(body);
				console.log(jsonWOEID);
				if (jsonWOEID.places.count != '0') {
					var pl = jsonWOEID.places.place[0]['placeTypeName attrs'].code;
					//console.log(pl);
					if (pl == 12 || pl == 8) {
						var placelatlong = jsonWOEID.places.place[0].centroid;
						var latRad = Math.abs(placelatlong.latitude - jsonWOEID.places.place[0].boundingBox.southWest.latitude);
						var longRad = Math.abs(placelatlong.longitude - jsonWOEID.places.place[0].boundingBox.southWest.longitude);
						
						var latradi = latRad * 110.574;
						var longradi = longRad * 111.320*Math.cos(placelatlong.latitude);
						var radi;
						if (latRad < longRad) {
							radi = latradi;
						} else {
							radi = longradi;
						}
						
						var letsjusttakeanaverage = (Math.abs(latradi) + Math.abs(longradi)) / 2;
						
						var whereItem = {
							woeid: jsonWOEID.places.place[0].woeid,
							name: jsonWOEID.places.place[0].name,
							country: jsonWOEID.places.place[0].country,
							latitude: placelatlong.latitude,
							longitude: placelatlong.longitude,
							radius: radi
						};
						console.log(whereItem);
						GLOB.WOEIDs[geoQuery] = whereItem;
						
						getTweets(whereItem, tweetQuery, res);
						return;
					} else {
						res.json({error: "WOEID not found"});
						return;
					}
				} else {
					res.json({error: "WOEID not found"});
					return;
				}
			})
		});

		getIt.on('error', function(e) {
			res.json({error: "Something happened"});
			console.log('ERROR: ' + e.message);
		});
	} else {
		var current = new Date();
		var timestamp = current.getTime();// 1800000 = 30 minutes in milliseconds
		if ((typeof GLOB.twits[tweetQuery] !== 'undefined') && ((GLOB.twits[tweetQuery].refresh+1800000) >= timestamp)) {
			// Cache hit!
			console.log("tweet cache hit!");
			res.json(GLOB.twits[tweetQuery].tweets);
		} else {
			console.log("WOEID cache hit!");
			getTweets(GLOB.WOEIDs[geoQuery], tweetQuery, res);
		}
	}
	
});

function getTweets(geoPlace, q, res) {
	
	var client = new Twitter({
		consumer_key: 'MQwEJdZrpkdEYzrk67bYWpTez',
		consumer_secret: 'jU2thpOFhCyuFimdUrsxjopyXIVgm55Pts85CdFajEYBFyzk0R',
		access_token_key: '',
		access_token_secret: ''
	});
	
	var geocode = geoPlace.latitude + "," + geoPlace.longitude + "," + geoPlace.radius + "km";
	geocode = geocode;
	//console.log(geocode);
	client.get('search/tweets', {
		q: q,
		geocode: geocode,
		count: 50
	}, function(error, tweets, response) {
		if(error) { res.json({error: error}); return;}
		//res.json(tweets);
		
		var current = new Date();
		var timestamp = current.getTime();// 3600000 = 1 hour in milliseconds
		
		var filtered = filterTweets(geoPlace, tweets);
		GLOB.twits[q] = {
			tweets: filtered,
			refresh: timestamp
		}
		res.json(filtered);
		
		//res.json(tweets);  // The favorites. 
		//res.send(tweets);  // Raw response object. 
	});
	
	/*
	client.get('trends/place', {id: geoPlace}, function(error, tweets, response){
		//if(error) res.send(error);
		//res.json(tweets);  // The favorites. 
		res.send(response);  // Raw response object. 
	});
	*/
}

function filterTweets(geoPlace, tweets) {
	var filteredtwits = [];
	var statuses = tweets.statuses;

	for(x in tweets.statuses) {
		if (typeof tweets.statuses[x].place !== 'undefined' && tweets.statuses[x].place != null) {
			//console.log(geoPlace.country);
			if (tweets.statuses[x].place.country == geoPlace.country) {
				filteredtwits.push(tweets.statuses[x]);
			}
		} else {
			filteredtwits.push(tweets.statuses[x]);
		}
	}
	var newLength = filteredtwits.length;
	tweets.statuses = filteredtwits;
	tweets.search_metadata.count = newLength;
	return tweets;
}


module.exports = router;
