var express = require('express');
const helper = require('../helper');
var router = express.Router();
const query = require('../queries');
const c = require('../calendar');

router.get('/', helper.ensureAuthentication, async function(req, res, next) {
    const userId = req.session.user.id;
    let options = {};
    const date = c.getDate(helper.createTimestamp(Date.now()));
    dateIndex = date.month - 1;
    options.calendar = c.generateCalendarData(date.year, dateIndex);

    const mealIds = await query.getMealIdsByMonth(date.year, date.month, userId);
    let uniqueMealIdArrary = [];
    let isDuplicate;
    for (let i = 0; i < mealIds.length; i++){
      if (mealIds[i].meal_ids !== null && mealIds[i].meal_ids.length !== 0){
          for(let j = 0; j < (mealIds[i].meal_ids.length); j++){
            isDuplicate = uniqueMealIdArrary.includes(mealIds[i].meal_ids[j]);
            if (isDuplicate === false){
              uniqueMealIdArrary.push(mealIds[i].meal_ids[j]);
            }
          }
      }
    }
    const uniqueMeals = await query.getMultipleMealsById(uniqueMealIdArrary);
    const bucketName = 'mealplanner-meal-images';
    for (let i = 0; i < uniqueMeals.length; i++){
      uniqueMeals[i].image = await  helper.getSignedUrl(uniqueMeals[i].image, bucketName);
    }

    for(let i = 0; i < mealIds.length; i++){
      mealIds[i].meals = [];
      if (mealIds[i].meal_ids === null){
        delete mealIds[i].meal_ids;
        continue;
      }
      for(let j = 0; j < mealIds[i].meal_ids.length; j++){
        for (let k = 0; k < uniqueMeals.length; k++){
          if (mealIds[i].meal_ids[j] === uniqueMeals[k].id){
            mealIds[i].meals.push(uniqueMeals[k]);
          }
        }

      }
      delete mealIds[i].meal_ids;
    }
    console.log(mealIds);
    let k = 0;
    let tempDate = {
      year: date.year,
      month: date.month,
      day:''
    };
    for (let i = 0; i < options.calendar.weeksArray.length; i++){
      for (let j = 0; j < options.calendar.weeksArray[i].length; j++){
        if (options.calendar.weeksArray[i][j].day === 'x'){
          continue;
        }
        tempDate.day = parseInt(options.calendar.weeksArray[i][j].day);
        options.calendar.weeksArray[i][j].day_id = await query.getDayId(tempDate);
        options.calendar.weeksArray[i][j].meals = mealIds[k].meals
        k++;
      }
    }
    console.log(options.calendar.weeksArray);
    res.render('calendar', {options});
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

  const result = await query.addToCalendar(day, month, year, userId, mealId);
  if (result === 0){
    res.redirect('/meals');
  }
});

module.exports = router;