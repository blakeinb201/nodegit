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
	
	var geoQuery = req.query['geo'];
	var tweetQuery = req.query['q'];
	
	if (typeof GLOB.WOEIDs[geoQuery] === 'undefined') {
		var apiKey = 'dj0yJmk9T0tZZ0JhRW1hb0FnJmQ9WVdrOVJVMHhNbXQxTlRBbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1iMA--';
		
		var fullQuery = "/v1/places.q('" + geoQuery + "')?format=json&appid=" + apiKey;
		
		var options = {
			host: 'where.yahooapis.com',
			path: fullQuery
		};

		var getIt = http.get(options, function(re) {
			//console.log('STATUS: ' + res.statusCode);
			//console.log('HEADERS: ' + JSON.stringify(res.headers));
			var bodyChunks = [];
			re.on('data', function(chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				var jsonWOEID = JSON.parse(body);

				if (jsonWOEID.places.count != '0') {
					var placelatlong = jsonWOEID.places.place[0].centroid;
					var latRad = Math.abs(placelatlong.latitude - jsonWOEID.places.place[0].boundingBox.southWest.latitude);
					var longRad = Math.abs(placelatlong.longitude - jsonWOEID.places.place[0].boundingBox.southWest.longitude);
					
					var radi;
					if (latRad > longRad) {
						radi = latRad * 110.574;
					} else {
						radi = longRad * 111.320*Math.cos(placelatlong.latitude);
					}
					
					var whereItem = {
						woeid: jsonWOEID.places.place[0].woeid,
						latitude: placelatlong.latitude,
						longitude: placelatlong.longitude,
						radius: radi
					};
					
					GLOB.WOEIDs[geoQuery] = whereItem;
					
					getTweets(whereItem, tweetQuery, res);
					return;
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
		console.log("cache hit!");
		getTweets(GLOB.WOEIDs[geoQuery], tweetQuery, res);
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
	console.log(geocode);
	client.get('search/tweets', {
		q: q,
		geocode: geocode,
		result_type: 'mixed'
	}, function(error, tweets, response){
		if(error) { res.send(error); return;}
		res.json(tweets);  // The favorites. 
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


module.exports = router;
