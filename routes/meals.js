var express = require('express');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const bodyParser = require('body-parser');
var router = express.Router();
var helper = require('../helper');
const fileType = require('file-type-ext');
const fs = require('fs');
const multer = require('multer');
const query = require('../queries');
const path = require('path');
const { all, options } = require('./login');
const calendar = require('../calendar');


AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

const s3 = new AWS.S3();
const bucketName = 'mealplanner-meal-images';

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

router.get('/', async function(req, res, next) {
    let options = {};
    options.allTags = await query.getAllTags();
    options.allMeals = await query.getAllMeals();
    helper.renderAllMeals(res, options);
  });

router.post('/search', async function(req, res, next){
  let options = {};
  const search = req.body.search;
  const searchResults = await query.getMealsContaining(search);
  options.allMeals = searchResults;
  options.allTags = await query.getAllTags();
  options.search = search;
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
  console.log(options.activeFilters);
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

      // Check if the uploaded image exists and read it
      if (req.files && req.files.image && req.files.image.length > 0) {
        const imageFile = req.files.image[0];
        const buffer = fs.readFileSync(imageFile.path);
        const fileInfo = fileType(buffer);

        if (!fileInfo || (fileInfo.mime !== 'image/jpeg' && fileInfo.mime !== 'image/png')) {
            // Invalid file type, reject the upload.
            fs.unlinkSync(imageFile.path);
            return res.status(400).json({ error: 'Invalid file type. Only JPEG and PNG images are allowed.' });
        }

        const maxFileSizeBytes = 10 * 1024 * 1024; // 10MB

        if (imageFile.size > maxFileSizeBytes) {
          // File size too large, reject the upload.
            fs.unlinkSync(imageFile.path); 
            return res.status(400).json({ error: 'File size exceeds the allowed limit.' });
        }

          // Resize the image while maintaining aspect ratio
        const targetAspectRatio = 4 / 3; // For example, a 16:9 aspect ratio
        const targetWidth = 800; // Your desired width

        const targetHeight = Math.round(targetWidth / targetAspectRatio);
        const resizedImageBuffer = await sharp(buffer)
        .resize({
          width: targetWidth, // Replace with your desired width
          height: targetHeight, // Replace with your desired height
          fit: sharp.fit.cover,
          withoutEnlargement: true,
        })
        .toBuffer();

        filename = `meal-image-${Date.now()}.${fileInfo.ext}`;
        const params = {
          Bucket: bucketName,
          Key: filename,
          Body: resizedImageBuffer,
          ContentType: imageFile.mimetype,
        };
        
        s3.upload(params, (err, data) => {
          if (err) {
            console.error('Error uploading image:', err);
            return res.status(500).json({ error: 'Failed to upload image to S3.' });
          }
          // Clean up temp file
          fs.unlinkSync(imageFile.path);
        });
        
    }

    else{
      filename = 'yum-default.png'
    }
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
  options.ingredients = mealDetails.ingredients;
  options.directions = mealDetails.directions;
  options.mealImage = await helper.getSignedUrl(mealDetails.image, mealBucket);
  let timestamp = helper.createTimestamp(parseInt(mealDetails.time));
  const date = calendar.getDate(timestamp);
  options.date = calendar.getFormatedDate(date);

  let tagArray = [];
  let tagObj;
  if (mealDetails.tag_ids) {
    for (let i = 0; i < mealDetails.tag_ids.length; i++){
      tagObj = await query.getTagsById(mealDetails.tag_ids[i]);
      tagArray.push(tagObj[0].name);
    }
  }
  options.tags = tagArray;
  res.render('individualMeal', options);
});

module.exports = router;