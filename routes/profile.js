var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const calendar = require('../calendar');

const profileBucket = 'mealplanner-profile-images';
const mealBucket = 'mealplanner-meal-images';
router.get('/', helper.ensureAuthentication, async function(req, res, next) {
    let options = {};
    let mealIds = [];
    //get user_id and retrieve firstname
    if (!req.session.user.id){
      res.redirect('/login');
    }
    const userId = req.session.user.id;
    const activeUser = await query.findUserById(userId);
    options.firstName = activeUser.firstname;
    // get signed url for user profile image
    options.profileImg = await helper.getSignedUrl(activeUser.profile_img, profileBucket);
    //get timestamp
    const timestamp = helper.createTimestamp(Date.now());
    //extract date
    const date = calendar.getDate(timestamp);
    //calculate day of week
    options.dayOfWeek = calendar.getDayOfWeek(date.year, date.month, date.day);
    //get day_id
    const dayId = await query.getDayId(date);
    //get users days for the current week
    options.userWeek = await query.getUserWeek(dayId, userId, options.dayOfWeek);
    options.userWeek.forEach((day) => {
      if (day.meal_ids){
        mealIds.push(day.meal_ids);
      }
      else{
        mealIds.push(0);
      }
    })
    options.weekOfMeals = [];
    let dailyMeals = [];
    for (const day of mealIds) {
      if (day === 0) {
        options.weekOfMeals.push(0);
      } else {
        for (let i = 0; i < day.length; i++) {
          const meal = await query.getMealById(day[i]);
          dailyMeals.push(meal);
        }
        options.weekOfMeals.push([...dailyMeals]);
        dailyMeals = [];
      }
    }

    let defaultImage = 'yum-default.png';
    options.defaultMealImage = await helper.getSignedUrl(defaultImage, mealBucket);

    for (const day of options.weekOfMeals) {
      if (day !== 0){
        for (let i = 0; i < day.length; i++){
          const signedUrl = await helper.getSignedUrl(day[i].image, mealBucket);
          day[i].image = signedUrl;
        }
      }
    }
    setTimeout(() => {
      res.render('profile', options);
    }, 250);    
  });


  router.post('/removeMeal/:meal_id/:day_id', helper.ensureAuthentication, async function(req, res, next) {

  const mealId = req.params.meal_id;
  const userId = req.session.user.id;
  const dayId = req.params.day_id;

  query.removeMealFromCalendar(userId, mealId, dayId);
  res.redirect('/profile');
});

module.exports = router;