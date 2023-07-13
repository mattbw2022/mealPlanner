var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('calendar', undefined);
  });

module.exports = router;