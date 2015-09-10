var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
	if ((typeof req.query['geo'] !== 'undefined') && (req.query['geo'] != '')) {
		var geo = req.query['geo'];
		//var georeturn = GLOB.gHotTrendsCache[geo].splice(10);
		res.json(GLOB.gHotTrendsCache[geo].slice(0, 10));
	} else {
		res.json(GLOB.HEAT);
	}
});



module.exports = router;