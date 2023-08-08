var express = require('express');
const AWS = require('aws-sdk');
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
    let mealImages = [];

    const allMeals = await query.getAllMeals();
    allMeals.forEach(async (meal) => {
      mealImages.push(await helper.getSignedUrl(meal.image, bucketName));
    });
    console.log(mealImages);
    setTimeout(()=>{
      res.render('meals', {allMeals:allMeals, mealImages:mealImages});
    }, 250);
  });

router.get('/createMeal', helper.ensureAuthentication, async function(req, res, next){
  let options = await query.getAllTags();
  options.noTitle = false;
  options.isDuplicate = false;
  options.noIngredients = false;
  options.noDirections = false;
  console.log(options);
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
    console.log(duplicateMeal.length)
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
        filename = `meal-image-${Date.now()}.${fileInfo.ext}`;
        const params = {
          Bucket: bucketName,
          Key: filename,
          Body: buffer,
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
  console.log(mealDetails.tag_ids);
  if (mealDetails.tag_ids) {
    for (let i = 0; i < mealDetails.tag_ids.length; i++){
      tagObj = await query.getTagsById(mealDetails.tag_ids[i]);
      console.log(tagObj[0].name);
      tagArray.push(tagObj[0].name);
    }
  }
  options.tags = tagArray;
  console.log(options);
  res.render('individualMeal', options);
});

module.exports = router;