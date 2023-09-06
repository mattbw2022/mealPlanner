var express = require('express');
var queries = require('../queries');
var router = express.Router();
const bcrypt = require('bcrypt');
const { check } = require('express-validator');
let noUser = false;
let wrongPassword = false;

router.get('/', function(req, res, next) {
    res.render('login', undefined);

  });

router.post('/', async function(req, res, next) {
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
        res.redirect("/profile")

    } else {
      wrongPassword = true;
      res.render("login", {wrongPassword: wrongPassword});
    }
});

router.get('/recoverPassword', (req, res, next) =>{
  res.render('recoverPassword', undefined)
});

//add post route to handle user email entered. Will need messaging service to send email.
module.exports = router;