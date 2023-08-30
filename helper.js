const AWS = require('aws-sdk');
const { env } = require('process');
const query = require('./queries');
const fs = require('fs');
const fileType = require('file-type-ext');  
const multer = require('multer');
const sharp = require('sharp');




AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

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


function isLoggedIn(req, res, next) {
    res.locals.authenticated = req.session.authenticated || false;
    next();
  }

  function ensureAuthentication(req, res, next) {
    if (!req.session.authenticated || !req.session.user || !req.session.user.id) {
      req.flash('error', 'You must be logged in to add meals to a calendar or create meals.');
      return res.redirect('/login');
    }
    next();

  }
  
  

  
function checkPasswordStrength(password){
  if (password.length < 12){

  }
  let caps = 0;
  let nums = 0;
  const specialChars = "`~!@#$%^&*()_+-=/?.>,<:;|"
  let special = 0;
  for (let i = 0; i < password.length; i++){
      
      for (let j = 0; j < specialChars.length; j++){
          if(password[i] == specialChars[j]){
              special++;
              break;
          }
      }

      if (password[i] >= 'A' && password[i] <= 'Z') {
          caps++;
      }

      if (password[i] >= '0' && password[i] <= '9'){
          nums++;
      }
  }
  if (caps >= 1 && nums >=1 && special >=1){
      return true;
  }
  else return false;
}


const s3 = new AWS.S3();
async function getSignedUrl(key, bucketName) {
  try {
    const expiration = 3600;
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiration
    };

    return await s3.getSignedUrlPromise('getObject', params);
  } catch (err) {
    console.error('Error generating signed URL:', err);
    throw err;
  }
}


function createTimestamp(milliseconds) {
  const date = new Date(milliseconds);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


async function renderAllMeals(res, options){
  const bucketName = 'mealplanner-meal-images';

  options.mealImages = [];
  options.allMeals.forEach(async (meal) => {
    options.mealImages.push(await getSignedUrl(meal.image, bucketName));
  });
  setTimeout(()=>{
    res.render('meals', {options});
  }, 250);
}

async function addImage(req, bucketName){
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
          let imgName = '';
          if (bucketName === 'mealplanner-profile-images'){
            imgName = 'profile';
          }
          else if (bucketName === 'mealplanner-meal-images'){
            imgName = 'meal';
          }
          
          filename = `${imgName}-image-${Date.now()}.${fileInfo.ext}`;
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
      if (bucketName === 'mealplanner-meal-images'){
        filename = 'yum-default.png';
      }
      else{
        filename = 'default_profile.png';
      }
    }
      return filename
}

async function deleteImage(filename,bucketName){


  const s3 = new AWS.S3();

  const params = {
    Bucket: bucketName,  // Replace with your S3 bucket name
    Key: filename // Replace with the path of the image you want to delete
  };

  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.error('Error deleting image:', err);
    } else {
      ('Image deleted successfully', data);
    }
  });

}

function formatRecipe(mealDetails){
  let chars = [];
  let details = [];
  for (let i = 0; i < mealDetails.length; i++){
    if (mealDetails[i] !== "\r" || mealDetails[i] !== "\n"){
      chars.push(mealDetails[i]);
    }
    if (mealDetails[i] === "\n"){
      let line = chars.join('');
      if(line === '\r\n'){
        continue;
      }
      details.push(line);
      chars = [];
    }
  }

  return details;
}

async function arrangeCalendarInfo(mealIds, options, date){
  let uniqueMealIdArrary = [];
    let isDuplicate;
    for (let i = 0; i < mealIds.length; i++){
      if (mealIds[i].meal_ids !== null && mealIds[i].meal_ids.length !== 0){
          for(let j = 0; j < (mealIds[i].meal_ids.length); j++){
            isDuplicate = uniqueMealIdArrary.includes(mealIds[i].meal_ids[j]);
            if (isDuplicate === false){
              uniqueMealIdArrary.push(mealIds[i].meal_ids[j]);
            }
          }
      }
    }
    const uniqueMeals = await query.getMultipleMealsById(uniqueMealIdArrary);
    const bucketName = 'mealplanner-meal-images';
    for (let i = 0; i < uniqueMeals.length; i++){
      uniqueMeals[i].image = await getSignedUrl(uniqueMeals[i].image, bucketName);
    }

    for(let i = 0; i < mealIds.length; i++){
      mealIds[i].meals = [];
      if (mealIds[i].meal_ids === null){
        delete mealIds[i].meal_ids;
        continue;
      }
      for(let j = 0; j < mealIds[i].meal_ids.length; j++){
        for (let k = 0; k < uniqueMeals.length; k++){
          if (mealIds[i].meal_ids[j] === uniqueMeals[k].id){
            mealIds[i].meals.push(uniqueMeals[k]);
          }
        }

      }
      delete mealIds[i].meal_ids;
    }
    let k = 0;
    let tempDate = {
      year: date.year,
      month: date.month,
      day:''
    };
    for (let i = 0; i < options.calendar.weeksArray.length; i++){
      for (let j = 0; j < options.calendar.weeksArray[i].length; j++){
        if (options.calendar.weeksArray[i][j].day === 'x'){
          continue;
        }
        tempDate.day = parseInt(options.calendar.weeksArray[i][j].day);
        options.calendar.weeksArray[i][j].day_id = await query.getDayId(tempDate);
        options.calendar.weeksArray[i][j].meals = mealIds[k].meals
        k++;
      }
    }

    options.yearsArray = [];
    const yearsAvailable = await query.getYearsAvailable();
    for(yearsAvailable[0].min; yearsAvailable[0].min < yearsAvailable[0].max; yearsAvailable[0].min++){
      options.yearsArray.push(yearsAvailable[0].min);
    }
    options.yearsArray.push(yearsAvailable[0].max);
    return options;
}


  module.exports = {
    isLoggedIn: isLoggedIn,
    checkPasswordStrength: checkPasswordStrength,
    ensureAuthentication: ensureAuthentication,
    renderAllMeals: renderAllMeals,
    getSignedUrl: getSignedUrl,
    createTimestamp:createTimestamp,
    addimage:addImage,
    deleteImage: deleteImage,
    formatRecipe: formatRecipe,
    arrangeCalendarInfo: arrangeCalendarInfo
  }