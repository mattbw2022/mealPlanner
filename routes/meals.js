var express = require('express');
const AWS = require('aws-sdk');
var router = express.Router();
var helper = require('../helper');
const query = require('../queries');
const { all, options } = require('./login');
const calendar = require('../calendar');
const multer = require('multer');
const { render } = require('../app');


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
const mealBucket = 'mealplanner-meal-images';
const userBucket = 'mealplanner-profile-images';

router.get('/', async function(req, res, next) {
    let options = {};
    options.allTags = await query.getAllTags();
    options.allMeals = await query.getAllMeals();
    options.mealImages = [];
    options.allMeals.forEach(async (meal) => {
    options.mealImages.push(await helper.getSignedUrl(meal.image, mealBucket));
    });
    options.yearsArray = [];
    const yearsAvailable = await query.getYearsAvailable();
    for(yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++){
      options.yearsArray.push(yearsAvailable[0].min);
    }
    options.yearsArray.push(yearsAvailable[0].max);
    setTimeout(() =>{
      res.render('meals', {options});

    }, 250);
  });

//add checks to input data
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
//add checks to input data
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
//add checks to input data
router.post('/createMeal', helper.ensureAuthentication, 
upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), async function(req, res, next){
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
    
    filename = await helper.addimage(req, mealBucket);

    const time = Date.now();
    const newMeal = await query.addMeal(meal, req.session.user.id, filename, time);

    //function to add the new meal
    setTimeout(async () => {
      //function to get the signed link
      const mealImg = await helper.getSignedUrl(newMeal.image, mealBucket);
      const mealTitle = newMeal.title;
      res.render('mealAdded', {mealImg:mealImg, mealTitle:mealTitle});
    }, 1000);


});

router.get('/editMeal/:id', helper.ensureAuthentication, async function(req, res, next) {
  let options = {};
  const user_id = req.session.user.id;
  options.meal = await query.getMealById(req.params.id);
  options.tags = await query.getAllTags();
  if (user_id !== options.meal.user_id){
    req.flash('error', 'You are not authorized to edit this meal.');
    return res.redirect('/profile');
  }
  console.log(options.meal);
  console.log(options.tags);
  return res.render('editMeal', {options});
});

//add checks to input data
router.post('/editMeal/:id', helper.ensureAuthentication, 
upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), async function (req, res, next) {
  let options = {};
  const user_id = req.session.user.id;
  const newTitle = req.body.title;
  const newingredients = req.body.ingredients;
  const newDirections = req.body.directions;
  const newTags = req.body.tags;
  const newImg = req.files.image;
  console.log(newImg);
  let updates = {};
  
  const originalMeal = await query.getMealById(req.params.id);
  console.log(originalMeal);

  if (user_id !== originalMeal.user_id){
    req.flash('error', 'You are not authorized to edit this meal.');
    return res.redirect('/profile');
  }

  if (newTitle !== originalMeal.title){
    if (!newTitle){
      req.flash('error', 'A title is required for all meals.');
      return res.redirect(`/meals/editMeal/${req.params.id}`);
    }
    updates.title = newTitle;
  }
  if (newingredients !== originalMeal.ingredients){
    if(!newingredients){
      req.flash('error', 'All Meals must have at least 1 ingredient.');
      return res.redirect(`/meals/editMeal/${req.params.id}`);
    }
    updates.ingredients = newingredients;
  }
  if (newDirections !== originalMeal.directions){
    if(!newDirections){
      req.flash('error', 'All Meals must have at least 1 direction.');
      return res.redirect(`/meals/editMeal/${req.params.id}`);
    }
    updates.directions = newDirections;
  }
  if (newTags !== originalMeal.tag_ids){
    updates.tags = newTags;
  }
  if (newImg){
    if(originalMeal.image !== 'yum-default.png'){
      await helper.deleteImage(originalMeal.image, mealBucket);
    }
    updates.image = await helper.addimage(req, mealBucket);
  }



  await query.updateMeal(req.params.id, updates);
  req.flash('success', 'Meal updated successfully!');
  return res.redirect(`/meals/individualMeal/${req.params.id}`);

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
  options.username = creatorInfo.username;
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
  console.log(options);
  setTimeout(() => {
    res.render('individualMeal', options);
  }, 200);
});

router.get('/user/:username', async function(req, res, next) {
  const username = req.params.username;
  let user = await query.findUserByUsername(username);
  if(!user){
    res.status(500).send('No user affiliated with the given username.');
  }
  console.log(user);
  user.image = await helper.getSignedUrl(user.profile_img, userBucket)
  let meals = await query.getMealsByUserId(user.id);
  for(let i = 0; i < meals.length; i++){
    meals[i].image = await helper.getSignedUrl(meals[i].image, mealBucket)
  }
  let yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for(yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++){
    yearsArray.push(yearsAvailable[0].min);
  }
  yearsArray.push(yearsAvailable[0].max);
  const options = {
    user: user,
    meals: meals,
    yearsArray: yearsArray
  }

  return res.render('mealsByUser', {options});
});

module.exports = router;