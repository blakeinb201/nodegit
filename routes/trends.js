var express = require('express');
var router = express.Router();

var http = require('http');
var querystring = require('querystring');
var iso3166 = require("iso-3166-2");

/* GET trends. */
router.get('/', function(req, res, next) {

	var response = {};
	if (typeof req.query === 'undefined') {
		response = {error: "Invalid parameters"};
		res.json(response);
		return;
	}
	
	if ((typeof req.query['q'] === 'undefined') && (typeof req.query['geo'] === 'undefined')) {
		response = {error: "Invalid parameters"};
		res.json(response);
		return;
	}
	
	if (req.query['q'] == '') {
		response = {error: "Invalid query"};
		res.json(response);
		return;
	}
	
	var searchQuery = querystring.escape(req.query['q'].replace(/ /g,"+"));
	var geoLocation = req.query['geo'];
	var component = "geo=" + geoLocation + "&q=" + searchQuery;
	
	var fetch = "?hl=en-US&date=now+1-H&" + component + "&tz=Etc/GMT-10&content=1&cid=GEO_MAP_0_0&export=3";
	
	var current = new Date();
	var timestamp = current.getTime();// 3600000 = 1 hour in milliseconds
	
	if ((typeof GLOB.gSearchCache[component] !== 'undefined') && ((GLOB.gSearchCache[component].refresh + 3600000) >= timestamp)) {
		// cache is available and more recent than one hour
		console.log("Cache hit!");
		res.json(GLOB.gSearchCache[component].data);
	} else {
		// get results
		var options = {
			host: 'www.google.com',
			path: "/trends/fetchComponent" + fetch
		};

		var getIt = http.get(options, function(re) {
			var bodyChunks = [];
			re.on('data', function(chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				
				var current = new Date();
				var currenttimestamp = current.getTime();
				
				var stt = String.fromCharCode.apply(null, body);
				stt = stt.substring(stt.indexOf("{"));
				stt = stt.slice(0, -2);
				
				try {
					var jsonResponse = JSON.parse(stt);
				} catch (e) {
					jsonResponse.status = 'error';
					jsonResponse.errors = {error: "Malformed response"};
					console.log(stt);
				}
				if (jsonResponse.status == "error") {
					res.json(jsonResponse.errors);
					return;
				}
				
				var formatD = parseSearchResults(jsonResponse);
				
				// Sweet caching action
				var cacheInfo = {
					refresh: currenttimestamp,
					data: formatD
				};
				
				GLOB.gSearchCache[component] = cacheInfo;
				res.json(formatD);
			})
		});

		getIt.on('error', function(e) {
			res.json({error: "Something happened"});
			console.log('ERROR: ' + e.message);
		});
	}
});

function parseSearchResults(data) {
	var actualData = data.table.rows;
	var formattedData = [];
	
	// Initial table rows for displaying info
	formattedData.push(["Country", "Search volume index", {role:'tooltip'}]);
	for(a in actualData) {
		var name = '';
		
		// Does this have a real name?
		if (actualData[a].c[0].v.length == 2) {
			name = iso3166.country(actualData[a].c[0].v);
		} else {
			name = iso3166.subdivision(actualData[a].c[0].v);
		}
		
		// if it doesn't return anything then just use the country code
		if (Object.keys(name).length === 0) {
			name.name = actualData[a].c[0].v;
		}
		
		// These are broken in the library I used so I just hardcoded them in
		// Remember: don't try too hard.
		if (actualData[a].c[0].v == 'CD') {
			name.name = 'Democratic Republic of the Congo';
		}
		
		if (actualData[a].c[0].v == 'KP') {
			name.name = "Democratic People's Republic of Korea";
		}
		
		if (actualData[a].c[0].v == 'KR') {
			name.name = 'Republic of Korea';
		}
		
		// push the data for straight conversion in the google chart data from array function
		formattedData.push([actualData[a].c[0].v, actualData[a].c[1].v, name.name]);
	}
	return formattedData;
}

module.exports = router;