var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log(req.sessionID);
    res.render('profile', {profileImg:profileImg});
  });

module.exports = router;