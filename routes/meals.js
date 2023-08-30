var express = require('express');
const AWS = require('aws-sdk');
var router = express.Router();
var helper = require('../helper');
const query = require('../queries');
const { all, options } = require('./login');
const calendar = require('../calendar');
const multer = require('multer');


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
const bucketName = 'mealplanner-meal-images';

router.get('/', async function(req, res, next) {
    let options = {};
    options.allTags = await query.getAllTags();
    options.allMeals = await query.getAllMeals();
    options.mealImages = [];
    options.allMeals.forEach(async (meal) => {
    options.mealImages.push(await helper.getSignedUrl(meal.image, bucketName));
    });
    options.yearsArray = [];
    const yearsAvailable = await query.getYearsAvailable();
    for(yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++){
      options.yearsArray.push(yearsAvailable[0].min);
    }
    options.yearsArray.push(yearsAvailable[0].max);
    console.log(options.yearsArray);
    setTimeout(() =>{
      res.render('meals', {options});

    }, 250);
  });

router.post('/search', async function(req, res, next){
  let options = {};
  const search = req.body.search;
  const searchResults = await query.getMealsContaining(search);
  options.allMeals = searchResults;
  options.allTags = await query.getAllTags();
  options.search = search;
  options.yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for(yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++){
    options.yearsArray.push(yearsAvailable[0].min);
  }
  options.yearsArray.push(yearsAvailable[0].max);
  helper.renderAllMeals(res, options);

});

router.post('/filter', async function(req, res, next) {
  let options = {};
  const body = req.body.tags;

  let filters = [];
  if (typeof body === 'string'){
    filters = [parseInt(body, 10)];
  }
  else {
    filters = body;
  }

  const filteredMeals = await query.getMealsByTag(filters);
  options.allMeals = filteredMeals;
  options.allTags = await query.getAllTags();
  options.activeFilters = [];

  if (!body){
    req.flash('error', 'No filters selected!');
    return res.render('meals', {options});
  }
  
  let filterName;
  for (let i = 0; i < filters.length; i++){
    filterName = await query.getTagsById(filters[i]);
    options.activeFilters.push(filterName[0].name);
  }
  options.yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for(yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++){
    options.yearsArray.push(yearsAvailable[0].min);
  }
  options.yearsArray.push(yearsAvailable[0].max);
  helper.renderAllMeals(res, options);
});

router.get('/filter/:id', async function(req, res, next) {
  let options = {};
  let filters = [req.params.id];
  console.log(filters);
  const filteredMeals = await query.getMealsByTag(filters);
  options.allMeals = filteredMeals;
  options.allTags = await query.getAllTags();
  options.activeFilters = [];

  let filterName;
  for (let i = 0; i < filters.length; i++){
    filterName = await query.getTagsById(filters[i]);
    options.activeFilters.push(filterName[0].name);
  }
  options.yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for(yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++){
    options.yearsArray.push(yearsAvailable[0].min);
  }
  options.yearsArray.push(yearsAvailable[0].max);
  helper.renderAllMeals(res, options);
});

router.get('/createMeal', helper.ensureAuthentication, async function(req, res, next){
  let options = await query.getAllTags();
  options.noTitle = false;
  options.isDuplicate = false;
  options.noIngredients = false;
  options.noDirections = false;
  res.render('createMeal', options);
});

router.post('/createMeal',upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), async function(req, res, next){
  let filename;
  const meal = req.body;
  let options = await query.getAllTags();
  options.noTitle = false;
  options.isDuplicate = false;
  options.noIngredients = false;
  options.noDirections = false;

  if(!meal.title){
    options.noTitle = true;
    return res.render('createMeal', options);
  }
  const allMeals = await query.getAllMeals();
  // Check for duplicate title
  const duplicateMeal = allMeals.filter(currentMeal => currentMeal.title.toLowerCase() === meal.title.toLowerCase());
  if (duplicateMeal.length >= 1){
    options.isDuplicate = true;
    return res.render('createMeal', options)
  }

  if(!meal.ingredients){
    options.noIngredients = true;
    return res.render('createMeal', options);
  }
  if(!meal.directions){
    options.noDirections = true;
    return res.render('createMeal', options);
  }
    
    filename = await helper.addimage(req, bucketName);

    const time = Date.now();
    const newMeal = await query.addMeal(meal, req.session.user.id, filename, time);

    //function to add the new meal
    setTimeout(async () => {
      //function to get the signed link
      const mealImg = await helper.getSignedUrl(newMeal.image, bucketName);
      const mealTitle = newMeal.title;
      res.render('mealAdded', {mealImg:mealImg, mealTitle:mealTitle});
    }, 1000);


});

router.get('/individualMeal/:meal_id', async function (req, res, next) {
  const userBucket = 'mealplanner-profile-images';
  const mealBucket = 'mealplanner-meal-images';
  let options = {};

  const meal_id = req.params.meal_id;
  const mealDetails = await query.getMealById(meal_id);
  const creatorInfo = await query.findUserById(mealDetails.user_id);

  options.firstName = creatorInfo.firstname;
  options.lastName = creatorInfo.lastname;
  options.userImage = await helper.getSignedUrl(creatorInfo.profile_img, userBucket);

  options.title = mealDetails.title;
  mealDetails.ingredients;
  mealDetails.directions;
  options.mealImage = await helper.getSignedUrl(mealDetails.image, mealBucket);
  let timestamp = helper.createTimestamp(parseInt(mealDetails.time));
  const date = calendar.getDate(timestamp);
  options.date = calendar.getFormatedDate(date);

  let tagArray = [];
  let tagObj;
  if (mealDetails.tag_ids) {
    for (let i = 0; i < mealDetails.tag_ids.length; i++){
      tagObj = await query.getTagsById(mealDetails.tag_ids[i]);
      tagArray.push(tagObj[0]);
    }
  }
  options.ingredients = helper.formatRecipe(mealDetails.ingredients);
  options.directions = helper.formatRecipe(mealDetails.directions);
  options.tags = tagArray;
  res.render('individualMeal', options);
});

module.exports = router;