var express = require('express');
var router = express.Router();
var helper = require('../helper');

router.get('/', function(req, res, next) {
    res.render('meals', undefined);
  });

router.get('/addMeals', helper.ensureAuthentication, function(req, res, next){
  
  res.render('addMeals', undefined);
});

router.post('/addMeals', function(req, res, next){
  const newMeal = req.body;
  if(!newMeal.title){
    res.redirect('addMeals');
  }
  if(!newMeal.ingredients){
    res.redirect('addMeals');
  }
  if(!newMeal.directions){
    res.redirect('addMeals');
  }
  
  res.send(newMeal);
});

module.exports = router;