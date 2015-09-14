var express = require('express');
var router = express.Router();

var http = require('http');
var Twitter = require('twitter');
var querystring = require('querystring');

// GET /twit
router.get('/', function(req, res, next) {
	
	// Basic error checking
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
	
	// Nothing can be blank
	if ((req.query['geo'] == '') || (req.query['q'] == '')) {
		response = {error: "Invalid query"};
		res.json(response);
		return;
	}
	
	var geoQuery = querystring.escape(req.query['geo']);
	var tweetQuery = querystring.escape(req.query['q']);
	
	// Have we searched for this place before?
	if (typeof GLOB.WOEIDs[geoQuery] === 'undefined') {
		
		var apiKey = 'dj0yJmk9T0tZZ0JhRW1hb0FnJmQ9WVdrOVJVMHhNbXQxTlRBbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1iMA--';
		var fullQuery = "/v1/places.q('" + geoQuery + "')?format=json&appid=" + apiKey;
		
		var options = {
			host: 'where.yahooapis.com',
			path: fullQuery
		};

		var getIt = http.get(options, function(re) {
			var bodyChunks = [];
			re.on('data', function(chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				
				var jsonWOEID = JSON.parse(body);
				
				// Did we find a place?
				if (jsonWOEID.places.count != '0') {
					
					// Check it's a country or province
					var pl = jsonWOEID.places.place[0]['placeTypeName attrs'].code;
					if (pl == 12 || pl == 8) {
						var placelatlong = jsonWOEID.places.place[0].centroid;
						
						// Figure out degrees between the center and the bounding box
						var latRad = Math.abs(placelatlong.latitude - jsonWOEID.places.place[0].boundingBox.southWest.latitude);
						var longRad = Math.abs(placelatlong.longitude - jsonWOEID.places.place[0].boundingBox.southWest.longitude);
						
						// Some maths to calculate the approximate distance
						var latradi = latRad * 110.574;
						var longradi = longRad * 111.320*Math.cos(placelatlong.latitude);
						
						var radi;
						// Take the smaller one to remove things like mexicans in the US
						if (latRad < longRad) {
							radi = latradi;
						} else {
							radi = longradi;
						}
						
						// Cache the results
						var whereItem = {
							woeid: jsonWOEID.places.place[0].woeid,
							name: jsonWOEID.places.place[0].name,
							country: jsonWOEID.places.place[0].country,
							latitude: placelatlong.latitude,
							longitude: placelatlong.longitude,
							radius: radi
						};

						GLOB.WOEIDs[geoQuery] = whereItem;
						
						// Get the tweets from the place about the subject
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
		// Do we already have tweets about this subject in this place?
		var current = new Date();
		var timestamp = current.getTime();// 1800000 = 30 minutes in milliseconds
		
		// Are the tweets newer than 30 minutes?
		if ((typeof GLOB.twits[tweetQuery] !== 'undefined') && ((GLOB.twits[tweetQuery].refresh+1800000) >= timestamp)) {
			// Cache hit!
			console.log("tweet cache hit!");
			res.json(GLOB.twits[tweetQuery].tweets);
		} else {
			// We already have the WOEID so just get the tweets
			console.log("WOEID cache hit!");
			getTweets(GLOB.WOEIDs[geoQuery], tweetQuery, res);
		}
	}
	
});

// Retrieve tweets in a place about a subject
function getTweets(geoPlace, q, res) {
	
	var client = new Twitter({
		consumer_key: 'MQwEJdZrpkdEYzrk67bYWpTez',
		consumer_secret: 'jU2thpOFhCyuFimdUrsxjopyXIVgm55Pts85CdFajEYBFyzk0R',
		access_token_key: '',
		access_token_secret: ''
	});
	
	var geocode = geoPlace.latitude + "," + geoPlace.longitude + "," + geoPlace.radius + "km";
	
	// A nice library to fetch tweets
	client.get('search/tweets', {
		q: q,
		geocode: geocode,
		count: 50
	}, function(error, tweets, response) {
		if(error) { res.json({error: error}); return;}

		var current = new Date();
		var timestamp = current.getTime();// 3600000 = 1 hour in milliseconds
		
		// Filter the tweets for only the place we wanted
		var filtered = filterTweets(geoPlace, tweets);
		
		// Cache the results
		GLOB.twits[q] = {
			tweets: filtered,
			refresh: timestamp
		}
		res.json(filtered);
	});
}

function filterTweets(geoPlace, tweets) {
	var filteredtwits = [];
	var statuses = tweets.statuses;
	
	for(x in tweets.statuses) {
		// check if a place is provided and compare to the one we are searching for
		if (typeof tweets.statuses[x].place !== 'undefined' && tweets.statuses[x].place != null) {
			// If it is what we want push it
			if (tweets.statuses[x].place.country == geoPlace.country) {
				filteredtwits.push(tweets.statuses[x]);
			}
		} else {
			// If no place is provided then assume it's correct
			filteredtwits.push(tweets.statuses[x]);
		}
	}
	// Fix the count and save the new tweets
	var newLength = filteredtwits.length;
	tweets.statuses = filteredtwits;
	tweets.search_metadata.count = newLength;
	return tweets;
}

module.exports = router;
