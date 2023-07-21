var express = require('express');
var queries = require('../queries');
var router = express.Router();
const bcrypt = require('bcrypt');

let noUser = false;
let wrongPassword = false;

router.get('/', function(req, res, next) {
    res.render('login', undefined);

  });

router.post('/', async function(req, res, next) {
  const { email, password } = req.body;
  let user = await queries.findUserByEmail(email);
    if (!user) {
      noUser = true;
      return res.render("login", {noUser: noUser});
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

module.exports = router;