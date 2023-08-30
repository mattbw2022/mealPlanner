var express = require('express');
const helper = require('../helper');
var router = express.Router();
const query = require('../queries');
const c = require('../calendar');

router.get('/', helper.ensureAuthentication, async function(req, res, next) {
    const userId = req.session.user.id;
    let options = {};
    let dateIndex;
    let date;
    if (req.session.activeDate){
      dateIndex = req.session.activeDate.month - 1;
      date = req.session.activeDate;
    }
    else{
      date = c.getDate(helper.createTimestamp(Date.now()));
      dateIndex = date.month - 1;
    }
    options.calendar = c.generateCalendarData(date.year, dateIndex);
    const mealIds = await query.getMealIdsByMonth(date.year, date.month, userId);
    options = await helper.arrangeCalendarInfo(mealIds, options, date);
    req.session.activeDate = {
      year: date.year,
      month: date.month,
      day: date.day
    };
    res.render('calendar', {options});
  });

router.post('/moveMeal/:mealId/:dayId', helper.ensureAuthentication, async function(req, res, nex){
  const userId = req.session.user.id;
  const mealId = req.params.mealId;
  const originalDateId = req.params.dayId;
  const day = parseInt(req.body.day);
  const month = (parseInt(req.body.month) + 1);
  const year = parseInt(req.body.year);
  console.log(originalDateId);
  console.log(req.body);
  //remove meal from current date
  query.removeMealFromCalendar(userId, mealId, originalDateId);
  //add meal to selected date
  query.addToCalendar(day, month, year, userId, mealId);
  setTimeout(() => {
    res.redirect("/calendar");
  }, 100);
})

router.get('/nextMonth', helper.ensureAuthentication, async function(req, res, next){
  const userId = req.session.user.id;
  let options = {};
  if (req.session.activeDate.month === 12){
    req.session.activeDate.year++;
    req.session.activeDate.month = 1;
  }
  else{
    req.session.activeDate.month++;
  }
  let dateIndex = req.session.activeDate.month - 1;
  let date = req.session.activeDate;
  options.calendar = c.generateCalendarData(date.year, dateIndex);

  const mealIds = await query.getMealIdsByMonth(date.year, date.month, userId);
  options = await helper.arrangeCalendarInfo(mealIds, options, date);
  res.render('calendar', {options});  
});

router.get('/lastMonth', helper.ensureAuthentication, async function(req, res, next){
  const userId = req.session.user.id;
  let options = {};
  if (req.session.activeDate.month === 1){
    req.session.activeDate.year--;
    req.session.activeDate.month = 12;
  }
  else{
    req.session.activeDate.month--;
  }
  let dateIndex = req.session.activeDate.month - 1;
  let date = req.session.activeDate;
  options.calendar = c.generateCalendarData(date.year, dateIndex);

  const mealIds = await query.getMealIdsByMonth(date.year, date.month, userId);
  if (mealIds.length === 0){
    const yearsAvailable = await query.getYearsAvailable();
    console.log(yearsAvailable);
    req.flash('error', `Calendar data is only available from ${yearsAvailable[0].min} to ${yearsAvailable[0].max}`);
    return res.redirect('/calendar');
  }
  options = await helper.arrangeCalendarInfo(mealIds, options, date);
  res.render('calendar', {options});
})

router.post('/selectMonth', helper.ensureAuthentication, async function (req, res, next) {
  let options = {};
  const userId = req.session.user.id;
  let month = (parseInt(req.body.month) + 1);
  let monthIndex = parseInt(req.body.month);
  let year = parseInt(req.body.year);
  const date = {
    year: year,
    month: month
  };
  console.log(date);
  options.calendar = c.generateCalendarData(year, monthIndex);
  const mealIds = await query.getMealIdsByMonth(year, month, userId);
  options = await helper.arrangeCalendarInfo(mealIds, options, date);
  res.render('calendar', {options});
});

router.post('/addMeal/:id', helper.ensureAuthentication, async function(req, res, next) {
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