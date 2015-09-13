var http = require('http');
var async = require('async');

// Caching the initial trends
module.exports.cacheGHotness = cacheGHotness;

// Takes a callback and retrieves the trends in all available countries
function cacheGHotness(tcallback) {
	
	// Used to make sure things are working
	var nums = 0;
	
	// Hardcoded available countries ripped from google.
	var locations = {"Australia":"p8","Argentina":"p30","Austria":"p44","Belgium":"p41","Brazil":"p18","Canada":"p13","Chile":"p38","Colombia":"p32","Czech Republic":"p43","Denmark":"p49","Egypt":"p29","Finland":"p50","France":"p16","Germany":"p15","Greece":"p48","Hong Kong":"p10","Hungary":"p45","India":"p3","Indonesia":"p19","Israel":"p6","Italy":"p27","Japan":"p4","Kenya":"p37","Malaysia":"p34","Mexico":"p21","Netherlands":"p17","Nigeria":"p52","Norway":"p51","Philippines":"p25","Poland":"p31","Portugal":"p47","Romania":"p39","Russia":"p14","Saudi Arabia":"p36","Singapore":"p5","South Africa":"p40","South Korea":"p23","Spain":"p26","Sweden":"p42","Switzerland":"p46","Taiwan":"p12","Thailand":"p33","Turkey":"p24","Ukraine":"p35","United Kingdom":"p9","United States":"p1","Vietnam":"p28"};
	
	// The cache
	var cached = {};
	
	// Used to make sure things are working
	console.log(nums + "/" + Object.keys(locations).length);
	
	// For each item in the list, get the trends
	async.forEachOf(locations, function (val, key, callback) {
		var options = {
			host: 'www.google.com',
			path: '/trends/hottrends/hotItems?ajax=1&pn=' + val + '&htv=l'
		};

		var req = http.get(options, function(res) {
			var bodyChunks = [];
			res.on('data', function(chunk) {
				bodyChunks.push(chunk);
			}).on('end', function() {
				var body = Buffer.concat(bodyChunks);
				
				// Cache the data
				cached[key] = parseGTrends(body, key);
				
				// Used to make sure things are working
				nums += 1;
				console.log(nums + "/" + Object.keys(locations).length);
				
				// This is finished but don't actually finish thanks javascript you sure are a good language
				callback();
			})
		});

		req.on('error', function(e) {
			console.log('ERROR: ' + e.message);
			callback(e, null);
		});

		}, function (err) {
			// Ok now we can finish by calling another function instead of returning data
			if (err) console.error(err.message);
			// cached is now a map of JSON data 
			tcallback(cached);
			
	});
}

// Parse /trends/hottrends/hotItems and return array of useful information
// Fairly straightforward, just extracting only what is useful from each trend item
function parseGTrends(data, place) {
	var parsed = [];
	var JSONobj = JSON.parse(data);
	for(x in JSONobj.trendsByDateList) {
		for(y in JSONobj.trendsByDateList[x].trendsList) {
			var parsing = {};
			var item = JSONobj.trendsByDateList[x].trendsList[y];
			parsing['title'] = item.title;
			parsing['relatedSearchesList'] = item.relatedSearchesList;
			parsing['titleLinkUrl'] = item.titleLinkUrl;
			parsing['formattedTraffic'] = item.formattedTraffic;
			parsing['trafficLowerBound'] = item.trafficBucketLowerBound;
			parsing['hotnessLevel'] = item.hotnessLevel;
			parsing['country'] = place;
			parsed.push(parsing);
		}
	}
	return parsed;
}


















