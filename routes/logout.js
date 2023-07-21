var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    req.logOut(function(err){
        if (err){
            res.send(err);
        }
        res.redirect('/');
        
    });
});


module.exports = router;