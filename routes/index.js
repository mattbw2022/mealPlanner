var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const axios = require('axios');
const cheerio = require('cheerio');
const calendar = require('../calendar');



const userBucket = 'mealplanner-user-images';
const recipeBucket = 'mealplanner-recipe-images';

/* GET home page. */
router.get('/', async function(req, res, next) {
  let options = {};

    // const response = await axios.get('https://www.simplyrecipes.com/most-recent-5121175');
    // const htmlContent = response.data;
    // const $ = cheerio.load(htmlContent);
    // options.articles = [];
    // $('a[id*="mntl-card-list-items"]').each((index, element) => {
    //   const title = $(element).find('span.card__title').text();
    //   const url = $(element).attr('href');
    //   const img = $(element).find('img').attr('data-src');
    //   options.articles.push({ title, url, img });
    // });
    // options.articles = options.articles.slice(0, 10);


  const allRecipes = await query.getAllRecipes();
  console.log(allRecipes);
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
    userInfo = await query.findUserById(options.newRecipes[i].user_id);
    userImage = await helper.getSignedUrl(userInfo.profile_img, userBucket);
    dateCreated = calendar.getFormatedDate(calendar.getDate(helper.createTimestamp(parseInt(options.newRecipes[i].time))));
    options.newRecipes[i].userInfo = {
      username: userInfo.username, 
      image: userImage, 
      date: dateCreated
    };
  }
  options.recipes = allRecipes;
  
  setTimeout(()=>{
    res.render('index', {options});
  }, 100);
});

module.exports = router;