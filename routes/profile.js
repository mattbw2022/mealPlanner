var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const calendar = require('../calendar');
const multer = require('multer');


const userBucket = 'mealplanner-user-images';
const recipeBucket = 'mealplanner-recipe-images';


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
    let recipeIds = [];
    if (!req.session.user.id){
      res.redirect('/login');
    }
    const userId = req.session.user.id;
    const activeUser = await query.findUserById(userId);
    options.username = activeUser.username;
    options.profileImg = await helper.getSignedUrl(activeUser.profile_img, userBucket);
    const userRecipes = await query.getUserCreatedrecipes(userId);
    if (userRecipes){
      let userRecipeImg;
      for(let i = 0; i < userRecipes.length; i++){
        userRecipeImg = await helper.getSignedUrl(userRecipes[i].image, recipeBucket);
        userRecipes[i].image = userRecipeImg; 
    }
    options.userRecipes = userRecipes;
    }
  

    const timestamp = helper.createTimestamp(Date.now());
    const date = calendar.getDate(timestamp);
    options.dayOfWeek = calendar.getDayOfWeek(date.year, date.month, date.day);
    const dayId = await query.getDayId(date);
    options.userWeek = await query.getUserWeek(dayId, userId, options.dayOfWeek);
    options.userWeek.forEach((day) => {
      if (day.recipe_ids){
        recipeIds.push(day.recipe_ids);
      }
      else{
        recipeIds.push(0);
      }
    })
    options.weekOfRecipes = [];
    let dailyRecipes = [];
    for (const day of recipeIds) {
      if (day === 0) {
        options.weekOfRecipes.push(0);
      } else {
        for (let i = 0; i < day.length; i++) {
          const recipe = await query.getRecipeById(day[i]);
          dailyRecipes.push(recipe);
        }
        options.weekOfRecipes.push([...dailyRecipes]);
        dailyRecipes = [];
      }
    }

    for (const day of options.weekOfRecipes) {
      if (day !== 0){
        for (let i = 0; i < day.length; i++){
          const signedUrl = await helper.getSignedUrl(day[i].image, recipeBucket);
          day[i].image = signedUrl;
        }
      }
    }
    options.lists = await query.getListsByUserId(userId);

    options.year = date.year;
    setTimeout(() => {
      res.render('profile', options);
    }, 250);    
  });


  router.post('/removerecipe/:recipe_id/:day_id', helper.ensureAuthentication, async function(req, res, next) {

  const recipeId = req.params.recipe_id;
  const userId = req.session.user.id;
  const dayId = req.params.day_id;

  query.removeRecipeFromCalendar(userId, recipeId, dayId);
  res.redirect('/profile');
});

router.post('/updatePicture', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), helper.ensureAuthentication, async function(req, res, next) {
  const userId = req.session.user.id;

  const userInfo = await query.findUserById(userId);
  if(userInfo.profile_img !== 'default_profile.png'){
    await helper.deleteImage(userInfo.profile_img, userBucket);
  }
  const newImage = await helper.addimage(req, userBucket);
  await query.updateUserImage(userId, newImage);
  res.redirect('/profile');

});

module.exports = router;