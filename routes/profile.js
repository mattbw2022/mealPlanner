var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const calendar = require('../calendar');
const multer = require('multer');
const pool = require('../connection');
const {compare, genSaltSync, hashSync} = require('bcrypt');
const userBucket = 'mealplanner-user-images';
const recipeBucket = 'mealplanner-recipe-images';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
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
    options.user_id = activeUser.id;
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
  const url = require('url');

  const urlString = req.headers.referer;
  const parsedUrl = new URL(urlString);
  const path = parsedUrl.pathname;
  const referingPath = path.replace(/\//g, '');
  const recipeId = req.params.recipe_id;
  const userId = req.session.user.id;
  const dayId = req.params.day_id;
  query.removeRecipeFromCalendar(userId, recipeId, dayId);
  res.redirect(`/${referingPath}`);
});

router.get('/editAccount', helper.ensureAuthentication, async function(req, res, next){
  const userId = req.session.user.id;
  const userInfo = await query.findUserById(userId);

  userInfo.profile_img = await helper.getSignedUrl(userInfo.profile_img, userBucket);
  setTimeout(()=>{
    return res.render('editAccount', userInfo);
  }, 150);
});

router.post('/editAccount', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'upload', maxCount: 1 }]), helper.ensureAuthentication, async function (req, res, next){
  const userId = req.session.user.id;
  let updates = {};
  const newFirstName = req.body.firstname;
  const newLastName = req.body.lastname;
  const newUserName = req.body.username;
  const newEmail = req.body.email;
  const newPassword = req.body.newPassword;
  const currentPassword = req.body.currentPassword;
  const newQuestion = req.body.newQuestion;
  const newAnswer = req.body.newAnswer;
  const userInfo = await query.findUserById(userId);
  
  if (newFirstName && newFirstName !== userInfo.firstname){
    updates.firstname = newFirstName;
  }
  if (newLastName && newLastName !== userInfo.lastname){
    updates.lastname = newLastName;
  }
  if (newUserName && newUserName !== userInfo.username){
    const allUsernames = await query.getAllByColumn('username', 'users');
    for (let i = 0; i < allUsernames.length; i++){
      if (newUserName === allUsernames[i].username){
        req.flash('error', `Username ${newUserName} is already in use. Please try another username.`)
        return res.redirect('/profile/editAccount');
      }
    }
    updates.username = newUserName;
  }
  if (newEmail && newEmail !== userInfo.email){
    const allEmails = await query.getAllByColumn('email', 'users');
    for (let i = 0; i < allEmails.length; i++){
      if (newEmail === allEmails[i].email){
        req.flash('error', `Email ${newEmail} is already in use. Please try another email.`)
        return res.redirect('/profile/editAccount');
      }
    }
    updates.email = newEmail;
  }
  if ((!currentPassword && newPassword) || (currentPassword && !newPassword)){
    req.flash('error', 'Current password and a new password are required to change passwords.');
    return res.redirect('/profile/editAccount');
  }

  if(currentPassword && newPassword){
    const passwordMatch = await compare(currentPassword, userInfo.password);
    if (!passwordMatch){
      req.flash('error', 'The current password entered does not match the password on file.');
      return res.redirect('/profile/editAccount');
    }
    else{
      const strongPassword = helper.checkPasswordStrength(newPassword);
      if(!strongPassword){
        req.flash('error', 'Weak password, please review the requirements and try again:\n12 characters long\n1 capital letter\n1 special character');
        return res.redirect('/profile/editAccount');
      }
      else{
        const saltRounds = 10;
        const salt = genSaltSync(saltRounds);
        const hash = hashSync(newPassword, salt);
        updates.password = hash;
      }
    }
  }
  console.log(newQuestion, userInfo.security_question);
  if (newQuestion && newQuestion !== userInfo.security_question){
    console.log('not equal or no question')
    if(newAnswer && newAnswer !== userInfo.security_answer){
      updates.securityQuestion = newQuestion;
      updates.securityAnswer = newAnswer;
    }
    else{
      req.flash('error', 'A question and answer are required to update security question.')
      return res.redirect('/profile/editAccount');
    }
  }

  if (req.files && req.files.image && req.files.image.length > 0){
    if(userInfo.profile_img !== 'default_profile.png'){
      await helper.deleteImage(userInfo.profile_img, userBucket);
    }
    const newImage = await helper.addimage(req, userBucket);
    await query.updateUserImage(userId, newImage);
  }
  await query.updateUser(userId, updates);
  req.flash('success', 'Account updated successfully!');
  return res.redirect('/profile/editAccount');
});

router.get('/deleteAccount', helper.ensureAuthentication, async function (req, res, next) {
  const userId = req.session.user.id;
  await query.deleteUser(userId);
  return res.redirect('/logout');
});

module.exports = router;