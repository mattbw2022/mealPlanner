var express = require('express');
const { ensureAuthentication } = require('../helper');
var router = express.Router();

router.get('/', ensureAuthentication, function(req, res, next) {
    res.render('calendar', undefined);
  });

module.exports = router;