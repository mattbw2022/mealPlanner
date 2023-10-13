var express = require('express');
var queries = require('../queries');
var router = express.Router();
const bcrypt = require('bcrypt');
const helper = require('../helper');
const saltRounds = 10;
const { check, validationResult } = require('express-validator');
let noUser = false;
let wrongPassword = false;
const logger = require('../logger');

router.get('/', function(req, res, next) {
    console.log(req.session);
    res.render('login', undefined);
  });

router.post('/', [check('email').isEmail().normalizeEmail()] , async function(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Invalid input(s). Please check your email and password.');
    return res.redirect('/login');
  }
  const { email, password } = req.body;

  if (email && password){
    user = await queries.findUserByEmail(email);
    if (!user) {
      noUser = true;
      return res.render("login", {noUser: noUser});
    }
  }
  else {
    req.flash('error', 'Email and password are required to login.');
    return res.redirect('login');
  }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
        req.session.authenticated = true;
        req.session.user = {
          id: user.id,
          sessionID: req.sessionID
        }
        console.log(req.session);
        res.redirect("/profile")
    } else {
      wrongPassword = true;
      res.render("login", {wrongPassword: wrongPassword});
    }
});

router.get('/forgotPassword', async function (req, res, next){
  return res.render('forgotPassword', undefined);
});

router.post('/forgotPassword',check('email').isEmail(), async function (req, res, next){
  const {email, username} = req.body;
  let userInfo;
  if (email){
    try {
      userInfo = await queries.findUserByEmail(email);
    } catch (error) {
      logger.error(error); 
      req.flash('error', 'An unexpected error occurred');
      return redirect('/forgotPassword');
    }
  }
  else if (username && !email){
    try {
      userInfo = await queries.findUserByUsername(username); 
    } catch (error) {
      logger.error(error);
      req.flash('error', 'An unexpected error occurred');
      return redirect('/forgotPassword');
    }
  }
  else{
    req.flash('error', 'An email or username must be entered to retrieve the security question.');
    return res.redirect('/login/forgotPassword');
  }
  return res.json({success:true, securityQuestion:userInfo.security_question, id:userInfo.id});
});

router.post('/resetPassword/:id', check('answer').matches(/^[^<>]+$/).withMessage('Input cannot contain HTML tags'), async function(req, res, next){
  const userId = req.params.id;
  const answer = req.body.answer.toLowerCase();
  const userInfo = await queries.findUserById(userId);
  const userAnswer = userInfo.security_answer.toLowerCase();
  
  if (answer !== userAnswer){
    req.flash('error', 'The answer entered and the answer on file do not match.');
    return res.redirect('/login/forgotPassword');
  }
  return res.redirect(`/login/resetPassword/${userId}`);
})

router.get('/resetPassword/:id', async function(req, res, next){
  const userId = req.params.id;
  return res.render('resetPassword', {userId: userId})
});

router.post('/updatePassword/:id', async function(req, res, next){
  const userId = req.params.id;
  let password = req.body.password;
  if (!req.body.password){
    req.flash('error', 'A new password is required.');
    return res.redirect(`/login/resetPassword/${userId}`);
  }
  else{
    const strongPassword = helper.checkPasswordStrength(password);
    if(!strongPassword){
      req.flash('error', 'Weak password, see password requirements below:\n- 12 characters long\n- 1 capital letter\n- 1 special character');
      return res.redirect(`/login/resetPassword/${userId}`);
    }
  }
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(password, salt);
  password = {password:hash};
  await queries.updateUser(userId, password);
  const user = await queries.findUserById(userId);
  req.session.authenticated = true;
  req.session.user = {
    id: user.id,
    sessionID: req.sessionID
  }
  res.redirect("/profile")
});
module.exports = router;