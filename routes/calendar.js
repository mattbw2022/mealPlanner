var express = require('express');
const helper = require('../helper');
var router = express.Router();
const query = require('../queries');

router.get('/', function(req, res, next) {
    res.render('calendar', undefined);
  });

router.post('/addMeal/:id', helper.ensureAuthentication, async function(req, res, next) {
  let options = {};
  const mealId = parseInt(req.params.id);
  if (!mealId){
    res.status(404).send('No Meal was found!');
  }
  const userId = parseInt(req.session.user.id);
  const month = parseInt(req.body.month) + 1;
  const day = parseInt(req.body.day);
  const year = parseInt(req.body.year);

  const params = [mealId, userId, month, day, year];
  for (let i = 0; i < params.length; i++){
    console.log(params[i]);
  }
  options.allTags = await query.getAllTags();

  const result = await query.addToCalendar(day, month, year, userId, mealId);
  if (result === 0){
    options.allMeals = await query.getAllMeals();
    helper.renderAllMeals(res, options);
  }
});

module.exports = router;