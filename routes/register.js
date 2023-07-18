var express = require('express');
var router = express.Router();
var pool = require('../connection');
var queries = require('../queries');

router.get('/', function(req, res, next) {
    res.render('register', undefined);
  });

router.post("/", async (req, res) => {
  const user = req.body;
  const newUser = await pool.queries.createUser(user);
  if (newUser) {
    res.status(201).json({
      msg: "New user created!",
      newUser,
    });
  } else {
    res.status(500).json({ msg: "Unable to create user" });
  }
});

module.exports = router;