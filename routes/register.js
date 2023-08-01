var express = require('express');
var router = express.Router();
var queries = require('../queries');
const helper = require('../helper');
const bcrypt = require('bcrypt');
const saltRounds = 10;

let noInput;
let insecurePassword = false;
let emailInUse = false;

router.get('/', function(req, res, next) {
     res.render('register', {noInput: noInput , insecurePassword: insecurePassword});
  });

router.post("/", async (req, res) => {
  if (!req.body.firstname){
    noInput = 'firstname'
    return res.render('register', {noInput: noInput , insecurePassword: insecurePassword});
  }
  if (!req.body.lastname){
    noInput = 'lastname'
    return res.render('register', {noInput: noInput , insecurePassword: insecurePassword});
  }
  if (!req.body.email){
    noInput = 'email'
    return res.render('register', {noInput: noInput , insecurePassword: insecurePassword});
  }
  const queryResult = await queries.allEmails();
  queryResult.rows.forEach(element => {
    if (element.email === req.body.email){
      emailInUse = true;
    }
  });

  if(emailInUse){
    return res.render('register', {noInput: noInput , insecurePassword: insecurePassword, emailInUse:emailInUse});  
  }

  if (!req.body.password){
    noInput = 'password'
    return res.render('register', );
  }
  else{
    const password = req.body.password;
    const strongPassword = helper.checkPasswordStrength(password);
    if(!strongPassword){
      insecurePassword = true;
      return res.render('register', {noInput: noInput , insecurePassword: insecurePassword})
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
      id: user.id,
      sessionID: req.sessionID
    }

    res.redirect('/profile');
  } else {
    res.status(500).json({ msg: "Unable to create user" });
  }
});

module.exports = router;