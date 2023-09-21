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
    const recipeIds = await query.getRecipeIdsByMonth(date.year, date.month, userId);
    options = await helper.arrangeCalendarInfo(recipeIds, options, date);
    req.session.activeDate = {
      year: date.year,
      month: date.month,
      day: date.day
    };
    console.log(options.calendar.weeksArray);
    res.render('calendar', {options});
  });

router.post('/moveRecipe/:recipeId/:dayId', helper.ensureAuthentication, async function(req, res, nex){
  const userId = req.session.user.id;
  const recipeId = req.params.recipeId;
  const originalDateId = req.params.dayId;
  const day = parseInt(req.body.day);
  const month = (parseInt(req.body.month) + 1);
  const year = parseInt(req.body.year);
  query.removeRecipeFromCalendar(userId, recipeId, originalDateId);
  query.addToCalendar(day, month, year, userId, recipeId);
  setTimeout(() => {
    res.redirect("/calendar");
  }, 200);
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

  const recipeIds = await query.getRecipeIdsByMonth(date.year, date.month, userId);
  options = await helper.arrangeCalendarInfo(recipeIds, options, date);

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

  const recipeIds = await query.getRecipeIdsByMonth(date.year, date.month, userId);
  if (recipeIds.length === 0){
    const yearsAvailable = await query.getYearsAvailable();
    console.log(yearsAvailable);
    req.flash('error', `Calendar data is only available from ${yearsAvailable[0].min} to ${yearsAvailable[0].max}`);
    return res.redirect('/calendar');
  }
  options = await helper.arrangeCalendarInfo(recipeIds, options, date);
  res.render('calendar', {options});
})

router.post('/selectMonth', helper.ensureAuthentication, async function (req, res, next) {
  // Update active date property in session
  let options = {};
  const userId = req.session.user.id;
  let month = (parseInt(req.body.month) + 1);
  let monthIndex = parseInt(req.body.month);
  let year = parseInt(req.body.year);
  const date = {
    year: year,
    month: month
  };
  options.calendar = c.generateCalendarData(year, monthIndex);
  const recipeIds = await query.getRecipeIdsByMonth(year, month, userId);
  options = await helper.arrangeCalendarInfo(recipeIds, options, date);
  res.render('calendar', {options});
});

router.post('/addRecipe/:id', helper.ensureAuthentication, async function(req, res, next) {
  const recipeId = parseInt(req.params.id);
  if (!recipeId){
    res.status(404).send('No Recipe was found!');
  }
  const userId = parseInt(req.session.user.id);
  const month = parseInt(req.body.month) + 1;
  const day = parseInt(req.body.day);
  const year = parseInt(req.body.year);

  const result = await query.addToCalendar(day, month, year, userId, recipeId);
  if (result === 0){
    res.redirect('/recipes');
  }
});

module.exports = router;