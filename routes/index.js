var express = require('express');
var router = express.Router();
const helper = require('../helper');

const meals = [
  {image: 'images/kabob.jpg',
  imageAlt: 'Picture of Kabob',
  title: 'Kabobs'},
  {image: 'images/pancakes.jpg',
  imageAlt: 'Picture of pancakes',
  title: 'Pancakes'},
  {image: 'images/pizza.jpg',
  imageAlt: 'Picture of pizza',
  title: 'Pizza'},
  {image: 'images/steak.jpg',
  imageAlt: 'Picture of steak',
  title: 'Steak'}];

  const mealsNum = meals.length;
// get random index for meals
function randomIndex(max) {
  return Math.floor(Math.random() * max);
}

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log(req.session);
  res.render('index', {meal: meals[randomIndex(mealsNum)]});
});

module.exports = router;