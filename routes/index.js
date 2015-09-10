var express = require('express');
var router = express.Router();
// app.local.something
/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'HAPPENING time' });
});

module.exports = router;
