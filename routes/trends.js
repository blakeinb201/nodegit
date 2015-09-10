var express = require('express');
var router = express.Router();

var http = require('http');
var querystring = require('querystring');

var iso3166 = require("iso-3166-2");

/* GET users listing. */
router.get('/', function(req, res, next) {
	// req.params.something
	//res.send('respond with a resource');
	
	//https://www.google.com.au/trends/fetchComponent
	//?hl=en-US&date=now+4-H&
	//geo	// geo=AU
	//&q=Alison+Parker	// must have
	//&tz=Etc/GMT-10&content=1&cid=GEO_MAP_0_0&export=3
	
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
			//console.log('STATUS: ' + res.statusCode);
			//console.log('HEADERS: ' + JSON.stringify(res.headers));
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
				//console.log(GLOB.gSearchCache);
				res.json(formatD);
			})
		});

		getIt.on('error', function(e) {
			res.json({error: "Something happened"});
			console.log('ERROR: ' + e.message);
		});
	}
	
	//console.log("Params: ");
	//if (typeof req.query['hello'] !== 'undefined') console.log(req.query['hello']);
	//console.log(req.query);
	/*
	
	for(x in req.query) {
		console.log(req.query[x]);
	}
	*/
});

function parseSearchResults(data) {
	//table.rows
	var actualData = data.table.rows;
	var formattedData = [];
	formattedData.push(["Country", "Search volumn index", {role:'tooltip'}]);
	for(a in actualData) {
		var name = '';
		if (actualData[a].c[0].v.length == 2) {
			name = iso3166.country(actualData[a].c[0].v);
		} else {
			name = iso3166.subdivision(actualData[a].c[0].v);
		}
		
		if (Object.keys(name).length === 0) {
			name.name = actualData[a].c[0].v;
		}
		
		if (actualData[a].c[0].v == 'CD') {
			name.name = 'Democratic Republic of the Congo';
		}
		
		if (actualData[a].c[0].v == 'KP') {
			name.name = "Democratic People's Republic of Korea";
		}
		
		if (actualData[a].c[0].v == 'KR') {
			name.name = 'Republic of Korea';
		}
		//console.log(actualData[a].c[0].v);
		//console.log(name);
		formattedData.push([actualData[a].c[0].v, actualData[a].c[1].v, name.name]);
		//.replace(/ /g,"+") replace with whatever the table uses
		
		/*
		formattedData[actualData[a].c[0].v] = actualData[a].c[1].v;
		var areaDensity = {
			area: actualData[a].c[0].v,
			density: actualData[a].c[1].v
			
		};*/
		
		/*
		for(b in actualData[a].c) {
			actualData[a].c[b].v;
		}*/
	}
	//console.log(formattedData);
	return formattedData;
}


module.exports = router;