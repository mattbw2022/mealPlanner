var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const calendar = require('../calendar');
const multer = require('multer');


const profileBucket = 'mealplanner-profile-images';
const mealBucket = 'mealplanner-meal-images';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination folder where the uploaded files will be saved
    cb(null, 'uploads/'); // Create an "uploads" folder in your project root
  },
  filename: function (req, file, cb) {
    // Set the filename for the uploaded files
    cb(null, file.fieldname + '-' + Date.now());
  }
});

const upload = multer({ storage: storage });


router.get('/', helper.ensureAuthentication, async function(req, res, next) {
    let options = {};
    let mealIds = [];
    if (!req.session.user.id){
      res.redirect('/login');
    }
    const userId = req.session.user.id;
    const activeUser = await query.findUserById(userId);
    options.username = activeUser.username;
    options.profileImg = await helper.getSignedUrl(activeUser.profile_img, profileBucket);
    const userMeals = await query.getUserCreatedMeals(userId);
    if (userMeals){
      let userMealImg;
      for(let i = 0; i < userMeals.length; i++){
        userMealImg = await helper.getSignedUrl(userMeals[i].image, mealBucket);
        userMeals[i].image = userMealImg; 
    }
    options.userMeals = userMeals;
    }
  

    const timestamp = helper.createTimestamp(Date.now());
    const date = calendar.getDate(timestamp);
    options.dayOfWeek = calendar.getDayOfWeek(date.year, date.month, date.day);
    const dayId = await query.getDayId(date);
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

    for (const day of options.weekOfMeals) {
      if (day !== 0){
        for (let i = 0; i < day.length; i++){
          const signedUrl = await helper.getSignedUrl(day[i].image, mealBucket);
          day[i].image = signedUrl;
        }
      }
    }
    options.year = date.year;
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

router.post('/updatePicture', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), helper.ensureAuthentication, async function(req, res, next) {
  const userId = req.session.user.id;

  const userInfo = await query.findUserById(userId);
  if(userInfo.profile_img !== 'default_profile.png'){
    await helper.deleteImage(userInfo.profile_img, profileBucket);
  }
  const newImage = await helper.addimage(req, profileBucket);
  await query.updateUserImage(userId, newImage);
  res.redirect('/profile');

});

module.exports = router;