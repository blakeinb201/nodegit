var express = require('express');
var router = express.Router();

// GET /index
router.get('/', function(req, res, next) {
	// Not much to do here, probably don't even need it.
	res.render('index', { title: 'HAPPENING time' });
});

module.exports = router;
