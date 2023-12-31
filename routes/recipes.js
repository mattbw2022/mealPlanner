var express = require('express');
const AWS = require('aws-sdk');
var router = express.Router();
var helper = require('../helper');
const query = require('../queries');
const calendar = require('../calendar');
const multer = require('multer');
const {check} = require('express-validator');

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
const recipeBucket = 'mealplanner-recipe-images';
const userBucket = 'mealplanner-user-images';

router.get('/', async function (req, res, next) {
  let options = {};
  let favorites = null;
  if (req.session.authenticated){
    const userId = req.session.user.id;
    const userInfo = await query.findUserById(userId);
    favorites = userInfo.favorites;
    if (favorites === null){
      favorites = [];
    }
  }
  options.allTags = await query.getAllTags();
  options.allRecipes = await query.getAllRecipes();
  options.recipeImages = [];
  options.allRecipes.forEach(async (recipe) => {
    if (favorites){
      for(let i = 0; i < favorites.length; i++){
        if (recipe.id === favorites[i]){
          recipe.favorite = true;
          break;
        }
        else{
          recipe.favorite = false;
        }
      }
    }
    options.recipeImages.push(await helper.getSignedUrl(recipe.image, recipeBucket));
  });
  options.yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for (yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++) {
    options.yearsArray.push(yearsAvailable[0].min);
  }
  options.yearsArray.push(yearsAvailable[0].max);
  setTimeout(() => {
    res.render('recipes', { options });

  }, 250);
});

//add checks to input data
router.post('/search', check('search').escape(), async function (req, res, next) {
  let options = {};
  const search = req.body.search;
  const searchResults = await query.getRecipesContaining(search);
  options.allRecipes = searchResults;
  options.allTags = await query.getAllTags();
  options.search = search;
  options.yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for (yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++) {
    options.yearsArray.push(yearsAvailable[0].min);
  }
  options.yearsArray.push(yearsAvailable[0].max);
  helper.renderallRecipes(res, options);
});

//add checks to input data
router.post('/filter', async function (req, res, next) {
  let options = {};
  const body = req.body.tags;

  let filters = [];
  if (typeof body === 'string') {
    filters = [parseInt(body, 10)];
  }
  else {
    filters = body;
  }

  const filteredRecipes = await query.getRecipesByTag(filters);
  options.allRecipes = filteredRecipes;
  options.allTags = await query.getAllTags();
  options.activeFilters = [];

  if (!body) {
    req.flash('error', 'No filters selected!');
    return res.render('recipes', { options });
  }

  let filterName;
  for (let i = 0; i < filters.length; i++) {
    filterName = await query.getTagsById(filters[i]);
    options.activeFilters.push(filterName[0].name);
  }
  options.yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for (yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++) {
    options.yearsArray.push(yearsAvailable[0].min);
  }
  options.yearsArray.push(yearsAvailable[0].max);
  helper.renderallRecipes(res, options);
});

router.get('/filter/:id', async function (req, res, next) {
  let options = {};
  let filters = [req.params.id];
  const filteredRecipes = await query.getRecipesByTag(filters);
  options.allRecipes = filteredRecipes;
  options.allTags = await query.getAllTags();
  options.activeFilters = [];

  let filterName;
  for (let i = 0; i < filters.length; i++) {
    filterName = await query.getTagsById(filters[i]);
    options.activeFilters.push(filterName[0].name);
  }
  options.yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for (yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++) {
    options.yearsArray.push(yearsAvailable[0].min);
  }
  options.yearsArray.push(yearsAvailable[0].max);
  helper.renderallRecipes(res, options);
});

router.get('/createRecipe', helper.ensureAuthentication, async function (req, res, next) {
  let options = await query.getAllTags();
  options.noTitle = false;
  options.isDuplicate = false;
  options.noIngredients = false;
  options.noDirections = false;
  res.render('createRecipe', options);
});
//add checks to input data
router.post('/createRecipe', helper.ensureAuthentication, [check('title').escape(), check('servings').escape(), 
  check('ingredients').escape(), check('quantity').escape(), check('unit').escape(), check('ingredients').escape(),
  check('directions').escape(), check('tags').escape()],
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), async function (req, res, next) {
    let filename;
    const recipe = req.body;
    let options = await query.getAllTags();
    options.noTitle = false;
    options.isDuplicate = false;
    options.noIngredients = false;
    options.noDirections = false;

    if (!recipe.title) {
      options.noTitle = true;
      return res.render('createRecipe', options);
    }
    const allRecipes = await query.getAllRecipes();
    const duplicateRecipe = allRecipes.filter(currentRecipe => currentRecipe.title.toLowerCase() === recipe.title.toLowerCase());
    if (duplicateRecipe.length >= 1) {
      options.isDuplicate = true;
      return res.render('createRecipe', options)
    }

    if (!recipe.servings) {
      req.flash('error', 'Please provide the amount of servings.')
      return res.redirect('/recipes/createRecipe');
    }

    if (!recipe.ingredients) {
      req.flash('error', 'All recipes must have at least 1 ingredient');
      return res.redirect('/recipes/createRecipe');
    }

    if (Array.isArray(recipe.ingredients) === false) {
      let makeArray = recipe.ingredients;
      recipe.ingredients = [makeArray];
      makeArray = recipe.quantity;
      recipe.quantity = [makeArray];
      makeArray = recipe.unit;
      recipe.unit = [makeArray];
    }

    for (let i = 0; i < recipe.ingredients.length; i++) {
      if ((!recipe.ingredients[i])) {
        req.flash('error', 'Cannot add empty ingredients');
        return res.redirect('/recipes/createRecipe');
      }
    }

    let tempIngredientsArr = recipe.ingredients;
    recipe.ingredients = [];
    for (let i = 0; i < tempIngredientsArr.length; i++) {
      recipe.ingredients.push({
        quantity: recipe.quantity[i],
        unit: recipe.unit[i],
        ingredient: tempIngredientsArr[i]
      });
    }

    if (!recipe.directions) {
      options.noDirections = true;
      return res.render('createRecipe', options);
    }
    if (Array.isArray(recipe.directions) === false) {
      let makeArray = recipe.directions;
      recipe.directions = [makeArray];
    }

    for (let i = 0; i < recipe.directions.length; i++) {
      if (!recipe.directions[i]) {
        recipe.directions.splice(i, i);
      }
    }
    filename = await helper.addimage(req, recipeBucket);

    const time = Date.now();
    const newRecipe = await query.addRecipe(recipe, req.session.user.id, filename, time);
    const recipeImg = await helper.getSignedUrl(newRecipe.image, recipeBucket);
    options = {
      recipeImg: recipeImg,
      recipeTitle: newRecipe.title,
      id: newRecipe.id
    }
    setTimeout(async () => {
      res.render('recipeAdded', options);
    }, 500);
  });

router.get('/editRecipe/:id', helper.ensureAuthentication, async function (req, res, next) {
  let options = {};
  const user_id = req.session.user.id;
  options.recipe = await query.getRecipeById(req.params.id);
  options.tags = await query.getAllTags();
  if (user_id !== options.recipe.user_id) {
    req.flash('error', 'You are not authorized to edit this recipe.');
    return res.redirect('/profile');
  }
  return res.render('editRecipe', { options });
});

router.post('/checkTitle', helper.ensureAuthentication, async function (req, res, next){
  let newTitle = req.body.title;
  let duplicate = await query.getRecipeByTitle(newTitle);
    if (duplicate.length === 1){
      if (duplicate[0].title.toLowerCase() === newTitle.toLowerCase()){
        return res.json({success:true, duplicate:true});
      }
    }
    else{
      return res.json({success:true, duplicate:false});
    }
});

router.post('/editRecipe/:id', helper.ensureAuthentication, [check('title').escape(), check('servings').escape(), 
  check('ingredients').escape(), check('quantity').escape(), check('unit').escape(), check('ingredients').escape(),
  check('directions').escape(), check('tags').escape()],
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), async function (req, res, next) {
    let options = {};
    const user_id = req.session.user.id;
    const newTitle = req.body.title;
    const newingredient = req.body.ingredients;
    const newQuantity = req.body.quantity;
    const newUnit = req.body.unit;
    const newDirections = req.body.directions;
    const newTags = req.body.tags;
    const newImg = req.files.image;
    let updates = {};
    let newingredients = [];
    for (let i = 0; i < newingredient.length; i++){
      newingredients.push({
        quantity: newQuantity[i],
        unit: newUnit[i],
        ingredient: newingredient[i]
      })
    }
    const originalRecipe = await query.getRecipeById(req.params.id);

    if (user_id !== originalRecipe.user_id) {
      req.flash('error', 'You are not authorized to edit this recipe.');
      return res.redirect('/profile');
    }

    if (!newTitle) {
      req.flash('error', 'A title is required for all recipes.');
      return res.redirect(`/recipes/editRecipe/${req.params.id}`);
    }
    updates.title = newTitle;
    
    if (!newingredients) {
      req.flash('error', 'All recipes must have at least 1 ingredient.');
      return res.redirect(`/recipes/editRecipe/${req.params.id}`);
    }
    updates.ingredients = newingredients;
    

    if (!newDirections) {
      req.flash('error', 'All recipes must have at least 1 direction.');
      return res.redirect(`/recipes/editRecipe/${req.params.id}`);
    }
    updates.directions = newDirections;
    
    if (newTags !== originalRecipe.tag_ids) {
      updates.tags = newTags;
    }
    if (newImg) {
      if (originalRecipe.image !== 'yum-default.png') {
        await helper.deleteImage(originalRecipe.image, recipeBucket);
      }
      updates.image = await helper.addimage(req, recipeBucket);
    }

    await query.updateRecipe(req.params.id, updates);
    req.flash('success', 'Recipe updated successfully!');
    return res.redirect(`/recipes/individualRecipe/${req.params.id}`);

  });


router.get('/individualRecipe/:recipeId', async function (req, res, next) {
  let options = {};
  if (req.session.user){
    const userId = req.session.user.id;
    const userLists = await query.getListsByUserId(userId);
    options.lists = userLists;
  }

  const recipeId = parseInt(req.params.recipeId);
  const recipeDetails = await query.getRecipeById(recipeId);
  let creatorInfo = await query.findUserById(recipeDetails.user_id);
  if (!creatorInfo){
    creatorInfo = {
      id: recipeDetails.user_id,
      username: 'Deleted User',
      profile_img: 'default_profile.png'
    }
  }
  options.id = creatorInfo.id;
  options.username = creatorInfo.username;
  options.userImage = await helper.getSignedUrl(creatorInfo.profile_img, userBucket);

  options.servings = recipeDetails.servings
  options.title = recipeDetails.title;
  recipeDetails.ingredients;
  recipeDetails.directions;
  options.recipeImage = await helper.getSignedUrl(recipeDetails.image, recipeBucket);
  let timestamp = helper.createTimestamp(parseInt(recipeDetails.time));
  const date = calendar.getDate(timestamp);
  options.date = calendar.getFormatedDate(date);

  let tagArray = [];
  let tagObj;
  if (recipeDetails.tag_ids) {
    for (let i = 0; i < recipeDetails.tag_ids.length; i++) {
      tagObj = await query.getTagsById(recipeDetails.tag_ids[i]);
      tagArray.push(tagObj[0]);
    }
  }
  options.ingredients = helper.formatRecipe(recipeDetails.ingredients);
  options.directions = helper.formatRecipe(recipeDetails.directions);
  options.tags = tagArray;

  setTimeout(() => {
    res.render('individualRecipe', options);
  }, 200);
});

router.get('/user/:id', async function (req, res, next) {
  const id = parseInt(req.params.id);
  let user = await query.findUserById(id);
  if (!user) {
    user = {
      id: id,
      username: 'Deleted User',
      profile_img: 'default_profile.png'
    }
  }
  user.image = await helper.getSignedUrl(user.profile_img, userBucket)
  let recipes = await query.getRecipesByUserId(user.id);
  for (let i = 0; i < recipes.length; i++) {
    recipes[i].image = await helper.getSignedUrl(recipes[i].image, recipeBucket)
  }
  let yearsArray = [];
  const yearsAvailable = await query.getYearsAvailable();
  for (yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++) {
    yearsArray.push(yearsAvailable[0].min);
  }
  yearsArray.push(yearsAvailable[0].max);
  const options = {
    user: user,
    recipes: recipes,
    yearsArray: yearsArray
  }

  return res.render('recipesByUser', { options });
});

router.post('/handleFavorite/:id/:action', helper.ensureAuthentication, async function(req, res, next){
  const userId = req.session.user.id;
  const recipeId = parseInt(req.params.id);
  const action = req.params.action;
  let userInfo = await query.findUserById(userId);
  if (!userInfo.favorites){
    userInfo.favorites = [];
  }
  if (action === 'add-favorite'){
    userInfo.favorites.push(recipeId);
    await query.handleFavorites(userId, userInfo.favorites);
  }
  else{
    const newFavorites = userInfo.favorites.filter((favorite)=> favorite !== recipeId);
    await query.handleFavorites(userId, newFavorites);
  }
  res.json({success: true});
});

module.exports = router;