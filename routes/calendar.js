var express = require('express');
const helper = require('../helper');
var router = express.Router();
const query = require('../queries');
const c = require('../calendar');
const calendar = require('../calendar');
const logger = require('../logger');

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
    try {
      options.calendar = c.generateCalendarData(date.year, dateIndex);
      const recipeIds = await query.getRecipeIdsByMonth(date.year, date.month, userId);
      options = await helper.arrangeCalendarInfo(recipeIds, options, date);
      const maxYear = options.yearsArray[(options.yearsArray.length - 1)];
      req.session.activeDate = {
        year: date.year,
        month: date.month,
        day: date.day
      };
      return res.render('calendar', {options});  
    } catch (error) {
      logger.error(error);
      req.flash('error', 'An unexpected error occured');
      if (req.session.authenticaed){
        return res.redirect('/profile');
      }
      else{
        return res.redirect('/login');
      }
      
    }
    
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
  const currentMonth = req.session.activeDate.month;
  if (req.session.activeDate.month === 12){
    req.session.activeDate.year++;
    req.session.activeDate.month = 1;
  }
  else{
    req.session.activeDate.month++;
  }
  let dateIndex = req.session.activeDate.month - 1;
  let date = req.session.activeDate;
  try {
    const maxYear = await query.getMaxOrMinYear(userId, true);
    if (maxYear < date.year){
      req.session.activeDate.year = maxYear;
      req.session.activeDate.month = currentMonth;
      req.flash('error','Calendars only extend to the end of the next year.');
      return res.redirect('/calendar');
    }
  }
  catch (error){
    logger.error('Error finding min/max year from database');
    req.flash('error', 'An unexpected error occured.');
    return res.redirect('/calendar');
  }
  options.calendar = c.generateCalendarData(date.year, dateIndex);

  const recipeIds = await query.getRecipeIdsByMonth(date.year, date.month, userId);
  options = await helper.arrangeCalendarInfo(recipeIds, options, date);

  res.render('calendar', {options});  
});

router.get('/lastMonth', helper.ensureAuthentication, async function(req, res, next){
  const userId = req.session.user.id;
  let options = {};
  const currentMonth = req.session.activeDate.month;
  if (req.session.activeDate.month === 1){
    req.session.activeDate.year--;
    req.session.activeDate.month = 12;
  }
  else{
    req.session.activeDate.month--;
  }
  let dateIndex = req.session.activeDate.month - 1;
  let date = req.session.activeDate;
  const minYear = await query.getMaxOrMinYear(userId, false);
  if (minYear > date.year){
    req.session.activeDate.year = minYear;
    req.session.activeDate.month = currentMonth;
    req.flash('error','Calendars only extend to the end of the next year.');
    return res.redirect('/calendar');
  }
  options.calendar = c.generateCalendarData(date.year, dateIndex);

  const recipeIds = await query.getRecipeIdsByMonth(date.year, date.month, userId);
  if (recipeIds.length === 0){
    const yearsAvailable = await query.getYearsAvailable();
    req.flash('error', `Calendar data is only available from ${yearsAvailable[0].min} to ${yearsAvailable[0].max}`);
    return res.redirect('/calendar');
  }
  options = await helper.arrangeCalendarInfo(recipeIds, options, date);
  res.render('calendar', {options});
})

router.post('/selectMonth', helper.ensureAuthentication, async function (req, res, next) {
  const activeDate = req.session.activeDate;
  let options = {};
  const userId = req.session.user.id;
  let month = (parseInt(req.body.month) + 1);
  let monthIndex = parseInt(req.body.month);
  let year = parseInt(req.body.year);
  activeDate.year = year;
  activeDate.month = month;
  req.session.activeDate = activeDate;
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
    return res.status(404).send('No Recipe was found!');
  }
  const userId = parseInt(req.session.user.id);
  const month = parseInt(req.body.month) + 1;
  const day = parseInt(req.body.day);
  const year = parseInt(req.body.year);

  await query.addToCalendar(day, month, year, userId, recipeId);
  req.flash('success', `Recipe added to ${month}/${day}/${year} in your calendar!`)
  return res.redirect('/recipes');

});

module.exports = router;