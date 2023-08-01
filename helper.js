const AWS = require('aws-sdk');
const { env } = require('process');
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'us-east-2',
});

const S3 = new AWS.S3();
const bucketName = 'mealplanner-meal-images';

function isLoggedIn(req, res, next) {
    res.locals.authenticated = req.session.authenticated || false;
    next();
  }

function ensureAuthentication(req, res, next){
  if(!req.session.authenticated){
    res.redirect('/login')
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
async function getSignedUrl(key) {
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


  module.exports = {
    isLoggedIn: isLoggedIn,
    checkPasswordStrength: checkPasswordStrength,
    ensureAuthentication: ensureAuthentication,
    getSignedUrl: getSignedUrl,
    createTimestamp:createTimestamp
  }