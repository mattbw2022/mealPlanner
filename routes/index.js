var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const axios = require('axios');
const cheerio = require('cheerio');
const calendar = require('../calendar');



const userBucket = 'mealplanner-user-images';
const recipeBucket = 'mealplanner-recipe-images';


router.get('/', async function(req, res, next) {
  let options = {};

  const allRecipes = await query.getAllRecipes();
    for(let i = 0; i < allRecipes.length; i++){
      allRecipes[i].image = await helper.getSignedUrl(allRecipes[i].image, recipeBucket);
    }
 

  if(allRecipes.length > 100){
    while (allRecipes.length > 100){
      allRecipes.slice(Math.random(Math.floor() * allRecipes.length));
    }
  }
  options.newRecipes = await query.getnewRecipes();
  for(let i = 0; i < options.newRecipes.length; i++){
    options.newRecipes[i].image = await helper.getSignedUrl(options.newRecipes[i].image, recipeBucket);
  }
  let userInfo;
  let dateCreated;
  for (let i = 0; i < options.newRecipes.length; i++){
    dateCreated = calendar.getFormatedDate(calendar.getDate(helper.createTimestamp(parseInt(options.newRecipes[i].time))));
    userInfo = await query.findUserById(options.newRecipes[i].user_id);
    if (userInfo){
      userImage = await helper.getSignedUrl(userInfo.profile_img, userBucket);
      options.newRecipes[i].userInfo = {
      username: userInfo.username, 
      image: userImage, 
      date: dateCreated
      };
    }
    else{
      userImage = await helper.getSignedUrl('default_profile.png', userBucket);
      options.newRecipes[i].userInfo = {
        username: 'Former User', 
        image: userImage, 
        date: dateCreated
        };
    }
    
  }
  options.recipes = allRecipes;
  
  setTimeout(()=>{
    res.render('index', {options});
  }, 100);
});

module.exports = router;