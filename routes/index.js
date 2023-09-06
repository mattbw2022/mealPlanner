var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const axios = require('axios');
const cheerio = require('cheerio');
const calendar = require('../calendar');



const userBucket = 'mealplanner-profile-images';
const mealBucket = 'mealplanner-meal-images';

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


  const allMeals = await query.getAllMeals();
    for(let i = 0; i < allMeals.length; i++){
      allMeals[i].image = await helper.getSignedUrl(allMeals[i].image, mealBucket);
    }
 

  if(allMeals.length > 100){
    while (allMeals.length > 100){
      allMeals.slice(Math.random(Math.floor() * allMeals.length));
    }
  }
  options.newestMeals = await query.getNewestMeals();
  for(let i = 0; i < options.newestMeals.length; i++){
    options.newestMeals[i].image = await helper.getSignedUrl(options.newestMeals[i].image, mealBucket);
  }
  let userInfo;
  let dateCreated;
  for (let i = 0; i < options.newestMeals.length; i++){
    userInfo = await query.findUserById(options.newestMeals[i].user_id);
    userImage = await helper.getSignedUrl(userInfo.profile_img, userBucket);
    dateCreated = calendar.getFormatedDate(calendar.getDate(helper.createTimestamp(parseInt(options.newestMeals[i].time))));
    options.newestMeals[i].userInfo = {
      username: userInfo.username, 
      image: userImage, 
      date: dateCreated
    };
  }
  options.meals = allMeals;
  
  setTimeout(()=>{
    res.render('index', {options});
  }, 100);
});

module.exports = router;