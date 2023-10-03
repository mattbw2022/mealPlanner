var express = require('express');
var router = express.Router();
var queries = require('../queries');
const helper = require('../helper');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const {check, validationResult} = require('express-validator');
const {createTimestamp} = require('../helper');
const {getDate} = require('../calendar');

let options = {
  noInput: '',
  emailInUse: false,
  insecurePassword: false,
  usernameInUse: false
}

router.get('/', function(req, res, next) {
     res.render('register', {options});
  });

router.post("/", [check('firstname').escape(), check('lastname').escape(), check('username').escape(),], async (req, res) => {
  const result = validationResult(req);
  if (!req.body.firstname){
    options.noInput = 'firstname'
    return res.render('register', {options});
  }
  if (!req.body.lastname){
    options.noInput = 'lastname'
    return res.render('register', {options});
  }
  if (!req.body.username){
    options.noInput = 'username'
    return res.render('register', {options})
  }
  const duplicateUsername = await queries.findUserByUsername(req.body.username)
  if (duplicateUsername){
    options.usernameInUse = true;
    return res.render('register', {options})
  }
  if (!req.body.email){
    options.noInput = 'email'
    return res.render('register', {options});
  }
  const duplicateEmail = await queries.findUserByEmail(req.body.email);
  if (duplicateEmail){
    options.emailInUse = true;
    return res.render('register', {options});  

  }

  
  if (req.body.securityQuestion){
    if(req.body.securityQuestion === 'create-question' && req.body.customQuestion){
      req.body.securityQuestion = req.body.customQuestion;
      delete req.body.customQuestion;
    }
    else if (req.body.securityQuestion !== 'create-question'){
      securityQuestion = req.body.securityQuestion;
      delete req.body.customQuestion;
    }
    else{
      req.flash('error', 'A security question is required to sign up.');
      return res.redirect('/register');
    }
  }
  else{
    req.flash('error', 'A security question is required to sign up.');
    return res.redirect('/register');
  }

  let securityAnswer;
  if (!req.body.securityAnswer){
    req.flash('error', 'An answer to your security question is required.');
    return res.redirect('/register');
  }
  else{
    securityAnswer = req.body.securityAnswer;
    console.log(securityAnswer);
  }

  if (!req.body.password){
    options.noInput = 'password'
    return res.render('register', {options});
  }
  else{
    const password = req.body.password;
    const strongPassword = helper.checkPasswordStrength(password);
    if(!strongPassword){
      options.insecurePassword = true;
      return res.render('register', {options})
    }
    }
  
  let user = req.body;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(user.password, salt);
  user.password = hash;
  const newUser = await queries.createUser(user);
  if (newUser) {
    req.session.authenticated = true;
    req.session.user= {
      id: newUser.id,
      sessionID: req.sessionID
    }
    const date = getDate(createTimestamp(Date.now()));
    await queries.populateCalendarForNewUser(req.session.user.id, date);
    res.redirect('/profile');
  } else {
    res.status(500).json({ msg: "Unable to create user" });
  }
});

module.exports = router;