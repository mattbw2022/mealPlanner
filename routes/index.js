var express = require('express');
var router = express.Router();
const helper = require('../helper');
const query = require('../queries');
const axios = require('axios');
const cheerio = require('cheerio');


// get random index for meals
function randomIndex(max) {
  return Math.floor(Math.random() * max);
}

const userBucket = 'mealplanner-profile-images';
const mealBucket = 'mealplanner-meal-images';

/* GET home page. */
router.get('/', async function(req, res, next) {
  let options = {};

    // Fetch HTML content of the website
    const response = await axios.get('https://www.simplyrecipes.com/most-recent-5121175'); // Replace with the actual website URL
    const htmlContent = response.data;
    // Use Cheerio to parse HTML content
    const $ = cheerio.load(htmlContent);

    options.articles = [];
    // Extract article data
    $('a[id*="mntl-card-list-items"]').each((index, element) => {
      const title = $(element).find('span.card__title').text();
      const url = $(element).attr('href');
      const img = $(element).find('img').attr('data-src');
      options.articles.push({ title, url, img });
    });    

  const allMeals = await query.getAllMeals();
  options.mealImages = [];
    allMeals.forEach(async (meal) => {
    options.mealImages.push(await helper.getSignedUrl(meal.image, mealBucket));
  });
  const index = randomIndex(allMeals.length);
  setTimeout(()=>{
    options.randomMealImg = options.mealImages[index];
    options.randomMealName = allMeals[index].title;
    options.randomMealId = allMeals[index].id;
    res.render('index', {options});
  }, 250);
});

module.exports = router;