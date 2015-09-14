var express = require('express');
var router = express.Router();

// GET /hot
router.get('/', function(req, res, next) {
	// Check if the user wants something
	if ((typeof req.query['geo'] !== 'undefined') && (req.query['geo'] != '')) {
		var geo = req.query['geo'];
		
		// Only return 15 so it isn't cluttered
		res.json(GLOB.gHotTrendsCache[geo].slice(0, 15));
	} else {
		// If nothing is given just give the global top trends
		res.json(GLOB.HEAT);
	}
});

module.exports = router;