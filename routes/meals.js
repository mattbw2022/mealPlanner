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
const { all } = require('./login');


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

let isDuplicate = false;
let mealImages = [];
router.get('/', async function(req, res, next) {
    const allMeals = await query.getAllMeals();
    allMeals.forEach(async (meal) => {
      mealImages.push(await helper.getSignedUrl(meal.image));
    });
    console.log(mealImages);
    res.render('meals', {allMeals:allMeals, mealImages:mealImages});
  });

router.get('/addMeals', helper.ensureAuthentication, async function(req, res, next){

  const cuisineTags = await query.getTags('cuisine');
  const timeTags = await query.getTags('time');
  const difficultyTags = await query.getTags('difficulty');
  const categoryTags = await query.getTags('category');

  res.render('addMeals', {cuisineTags:cuisineTags, timeTags:timeTags, difficultyTags:difficultyTags, categoryTags:categoryTags});
});

router.post('/addMeals',upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), async function(req, res, next){
  const meal = req.body;
  console.log(meal);
  if(!meal.title){
    console.log('no title')
    return res.redirect('addMeals');
  }
  const allMeals = await query.getAllMeals();
  // Check for duplicate title
  const duplicateMeal = allMeals.filter(currentMeal => currentMeal.title.toLowerCase() === meal.title.toLowerCase());
  if (duplicateMeal.length >= 1){
    console.log(duplicateMeal.length)
    isDuplicate = true;
    return res.render('addMeals', {isDuplicate: isDuplicate})
  }

  if(!meal.ingredients){
    console.log('no ingredients')

    return res.redirect('addMeals');
  }
  if(!meal.directions){
    console.log('no directions')
    return res.redirect('addMeals');
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

        const filename = `meal-image-${Date.now()}.${fileInfo.ext}`;
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
    //function to add the new meal
    setTimeout(async () => {
      const newMeal = await query.addMeal(meal, req.session.user.id, filename, time);

      console.log(newMeal)
      //function to get the signed link
      const mealImg = await helper.getSignedUrl(newMeal.image);
      console.log(mealImg);
      console.log(typeof mealImg);
      const mealTitle = newMeal.title;
      console.log(newMeal.title);
      res.render('mealAdded', {mealImg:mealImg, mealTitle:mealTitle});
    }, 500);


});
module.exports = router;