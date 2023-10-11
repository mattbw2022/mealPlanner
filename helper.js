const AWS = require('aws-sdk');
const { env } = require('process');
const query = require('./queries');
const fs = require('fs');
const fileType = require('file-type-ext');  
const multer = require('multer');
const sharp = require('sharp');


AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

const bucketName = 'mealplanner-recipe-images';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
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
      req.flash('error', 'You must be logged in to add recipes to a calendar or create recipes.');
      return res.redirect('/login');
    }
    next();

  }
  
function checkPasswordStrength(password){
  if (password.length < 12){
    return false;
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
const recipeBucket = 'mealplanner-recipe-images';
const userBucket = 'mealplanner-user-images'

async function renderallRecipes(res, options){

  options.recipeImages = [];
  options.allRecipes.forEach(async (recipe) => {
    options.recipeImages.push(await getSignedUrl(recipe.image, recipeBucket));
  });
  setTimeout(()=>{
    res.render('recipes', {options});
  }, 250);
}

async function addImage(req, bucketName){

        if (req.files && req.files.image && req.files.image.length > 0) {
          const imageFile = req.files.image[0];
          const buffer = fs.readFileSync(imageFile.path);
          const fileInfo = fileType(buffer);
          if (!fileInfo || (fileInfo.mime !== 'image/jpeg' && fileInfo.mime !== 'image/png')) {
              fs.unlinkSync(imageFile.path);
              return res.status(400).json({ error: 'Invalid file type. Only JPEG and PNG images are allowed.' });
          }
          
          const maxFileSizeBytes = 10 * 1024 * 1024;
  
          if (imageFile.size > maxFileSizeBytes) {
              fs.unlinkSync(imageFile.path); 
              return res.status(400).json({ error: 'File size exceeds the allowed limit.' });
          }
  
          const targetAspectRatio = 3 / 2; 
          const targetWidth = 400;
  
          const targetHeight = Math.round(targetWidth / targetAspectRatio);
          const resizedImageBuffer = await sharp(buffer)
          .resize({
            width: targetWidth,
            height: targetHeight,
            fit: sharp.fit.cover,
            withoutEnlargement: true,
          })
          .toBuffer();
          let imgName = '';
          if (bucketName === 'mealplanner-user-images'){
            imgName = 'user';
          }
          else if (bucketName === 'mealplanner-recipe-images'){
            imgName = 'recipe';
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
            fs.unlinkSync(imageFile.path);
          });
          
        } 
  
    else{
      if (bucketName === 'mealplanner-recipe-images'){
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
    Bucket: bucketName, 
    Key: filename 
  };

  s3.deleteObject(params, (err, data) => {
    if (err) {
      console.error('Error deleting image:', err);
    } else {
      ('Image deleted successfully', data);
    }
  });

}

function formatRecipe(recipeDetails){
  let chars = [];
  let details = [];
  let lineCount = 0;
  for (let i = 0; i < recipeDetails.length; i++){
    if (recipeDetails[i] !== "\r" || recipeDetails[i] !== "\n"){
      chars.push(recipeDetails[i]);
    }
    if (recipeDetails[i] === "\n"){
      lineCount++;
      let line = chars.join('');
      if(line === '\r\n'){
        continue;
      }
      details.push(line);
      chars = [];
    }
  }
  if (lineCount === 0){
    details = recipeDetails;
  }

  return details;
}

async function arrangeCalendarInfo(recipeIds, options, date){
  try {
    let uniqueRecipeIdArray = [];
    let isDuplicate;
    for (let i = 0; i < recipeIds.length; i++){
      if (recipeIds[i].recipe_ids !== null && recipeIds[i].recipe_ids.length !== 0){
          for(let j = 0; j < (recipeIds[i].recipe_ids.length); j++){
            isDuplicate = uniqueRecipeIdArray.includes(recipeIds[i].recipe_ids[j]);
            if (isDuplicate === false){
              uniqueRecipeIdArray.push(recipeIds[i].recipe_ids[j]);
            }
          }
      }
    }
    const uniqueRecipes = await query.getMultipleRecipesById(uniqueRecipeIdArray);
    const bucketName = 'mealplanner-recipe-images';
    for (let i = 0; i < uniqueRecipes.length; i++){
      uniqueRecipes[i].image = await getSignedUrl(uniqueRecipes[i].image, bucketName);
    }

    for(let i = 0; i < recipeIds.length; i++){
      recipeIds[i].recipes = [];
      if (recipeIds[i].recipe_ids === null){
        delete recipeIds[i].recipe_ids;
        continue;
      }
      for(let j = 0; j < recipeIds[i].recipe_ids.length; j++){
        for (let k = 0; k < uniqueRecipes.length; k++){
          if (recipeIds[i].recipe_ids[j] === uniqueRecipes[k].id){
            recipeIds[i].recipes.push(uniqueRecipes[k]);
          }
        }

      }
      delete recipeIds[i].recipe_ids;
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
        options.calendar.weeksArray[i][j].recipes = recipeIds[k].recipes
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
  } catch (error) {
    throw new Error('Unable to arrange calendar data.')
  }

}

function checkForSingleInput(input){
  if (!Array.isArray(input)){
    const singleElementArray = [input];
    return singleElementArray
  }
  else{
    return input;
  }
}

  module.exports = {
    isLoggedIn: isLoggedIn,
    checkPasswordStrength: checkPasswordStrength,
    ensureAuthentication: ensureAuthentication,
    renderallRecipes: renderallRecipes,
    getSignedUrl: getSignedUrl,
    createTimestamp:createTimestamp,
    addimage:addImage,
    deleteImage: deleteImage,
    formatRecipe: formatRecipe,
    arrangeCalendarInfo: arrangeCalendarInfo,
    checkForSingleInput: checkForSingleInput,
  }