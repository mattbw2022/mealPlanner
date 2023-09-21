const pool = require('./connection');
const {isLeapYear} = require('./calendar');


async function createUser(user){
   try{
      const query1 = 'INSERT INTO public.users (firstname, lastname, email, password, username) VALUES ($1, $2, $3, $4, $5)';
      const values = [user.firstname, user.lastname, user.email, user.password, user.username];

      await pool.query(query1, values);
      const query2 = 'SELECT * FROM public.users WHERE email = $1::varchar';
      const newUser = await pool.query(query2, [user.email]);
      return newUser.rows[0];

   }catch(err){
      console.log(err);
   }
}

async function findUserByEmail(email){
   const query = 'SELECT * FROM public.users WHERE email = $1::varchar';
   const results = await pool.query(query, [email]);
   const user = results.rows[0];
   return user;
}

async function findUserByUsername(username){
   const query = 'SELECT * FROM users WHERE username = $1';
   const results = await pool.query(query, [username]);
   return results.rows[0];
}

async function allEmails(){
   const query = 'SELECT email FROM users';
   const results = await pool.query(query);
   return results;
}

async function findUserById(id){
   const query = 'SELECT * FROM public.users WHERE id = $1::integer';
   const results = await pool.query(query, [id]);
   if (results.rows.length > 1){
      console.log('duplicate id!');
   }
   const user = results.rows[0];
   return user;
}

async function addToCalendar(day, month, year, user_id, meal_id){
   try{
         const query = `UPDATE calendars
         SET recipe_ids = array_append(recipe_ids, $1)
         WHERE user_id = $2
         AND day = $3
         AND month = $4
         AND year = $5`;
         let values = [meal_id, user_id, day, month, year];
         await pool.query(query, values);
         return 0;
   }
   catch(error){
      return 'Querry error';
   }
}

async function addRecipe(recipe, user_id, image, time){
   let tagIds;
   try{
      if (recipe.tags){
         if (recipe.tags.length > 1){
            tagIds = recipe.tags.map(tag => parseInt(tag, 10)); 
         }
         else{
            tagIds = [parseInt(recipe.tags, 10)];
         }
      }
      else{
         tagIds = [];
      }

      const query1 = `INSERT INTO recipes (user_id, title, ingredients, directions, time, tag_ids, image, servings) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
      const values = [user_id, recipe.title, recipe.ingredients, recipe.directions, time, tagIds, image, recipe.servings]
      await pool.query(query1, values);

      const query2 = 'SELECT * FROM recipes WHERE user_id = $1::integer ORDER BY time DESC';
      const newMeal = await pool.query(query2, [user_id]);
      return newMeal.rows[0];

   }catch(err){
      console.log(err);
   }
}

async function getAllRecipes(){
   const query = `SELECT * FROM recipes`;
   const results = await pool.query(query);
   return results.rows;
}

async function getTagsByType(input){
   const  query = `SELECT * from tags WHERE type = $1 ORDER BY name`;
   const results = await pool.query(query, [input]);
   return results.rows;
}

async function getTagsById(tag_id){
   const query = `SELECT * FROM tags WHERE id = $1`;
   const results = await pool.query(query, [tag_id]);
   return results.rows;
}

async function getAllTags(){
   const cuisineTags = await getTagsByType('cuisine');
   const timeTags = await getTagsByType('time');
   const difficultyTags = await getTagsByType('difficulty');
   const categoryTags = await getTagsByType('category');
   
   const tags = {
      cuisineTags:cuisineTags,
      timeTags:timeTags,
      difficultyTags: difficultyTags,
      categoryTags: categoryTags
    }
    return tags;
 }

async function populateCalendarForNewUser(userId) {
   const startYear = 2023;
   const endYear = 2033;
   let dayId = 1;
   
   for (let year = startYear; year <= endYear; year++) {
     for (let month = 1; month <= 12; month++) {
       let daysInMonth = 31; // Default to 31 days
 
       if (month === 4 || month === 6 || month === 9 || month === 11) {
         daysInMonth = 30;
       } else if (month === 2) {
         daysInMonth = isLeapYear(year) ? 29 : 28;
       }
 
       for (let day = 1; day <= daysInMonth; day++) {
         const query = `
           INSERT INTO calendars (day_id, user_id, year, month, day)
           VALUES ($1, $2, $3, $4, $5)
         `;
         const values = [dayId, userId, year, month, day];
 
         try {
           await pool.query(query, values);
           dayId++;
         } catch (error) {
           console.error('Error populating calendar:', error);
         }
       }
     }
   }
 }

 async function getDayId(date){
   const query = `SELECT day_id FROM calendars WHERE year = $1 AND month = $2 AND day = $3 LIMIT 1`;
   const values = [date.year, date.month, date.day]
   const results = await pool.query(query, values);
   return results.rows[0].day_id;
 }

 async function getRecipeIdsByMonth(year, month, user_id){
   const query = `SELECT recipe_ids FROM calendars WHERE year = $1 AND month = $2 AND user_id = $3 ORDER BY day`;
   const values = [year, month, user_id];
   const results = await pool.query(query, values);
   return results.rows;
 }

 async function getRecipeById(meal_id){
   const query = `SELECT * FROM recipes WHERE id = $1`;
   const results = await pool.query(query, [meal_id]);
   return results.rows[0];
 }

 async function getMultipleRecipesById(meal_id_array){
   const query = `SELECT * FROM recipes WHERE id = ANY($1)`
   const results = await pool.query(query, [meal_id_array]);
   return results.rows;
 }

 async function getRecipesByUserId(user_id){
   const query = `SELECT * FROM recipes WHERE user_id = $1`;
   const results = await pool.query(query, [user_id]);
   return results.rows;
 }

 async function getRecipesContaining(search){
   const query = `SELECT * FROM recipes
                  WHERE title LIKE $1
                  OR ingredients LIKE $1
                  OR directions LIKE $1`;
   const results = await pool.query(query, [`%${search}%`]);
   return results.rows;
 }

 async function getRecipesByTag(tag_arr){
      let tagIds;
      try{
         if (tag_arr){
            if (tag_arr.length > 1){
               console.log('Array Length: ' + tag_arr.length);
               tagIds = tag_arr.map(tag => parseInt(tag, 10)); 
            }
            else{
               tagIds = [parseInt(tag_arr, 10)];
            }
         }
         console.log(tagIds);
         const query = `SELECT * FROM recipes WHERE tag_ids && $1`
         const results = await pool.query(query, [tagIds]);
         return results.rows;
         
      }
      catch(err){
         console.log(err)
      }
 }

 async function getnewRecipes(){
   const query = 'SELECT * FROM recipes ORDER BY time DESC LIMIT 10';
   const results = await pool.query(query);
   return results.rows;
 }

 async function getUserWeek(day_id, user_id, dayOfWeek){
   let starting_id;
   let ending_id;
   switch(dayOfWeek){
      case 'Monday':
        starting_id = day_id
        ending_id = day_id + 6;
        break;
      case 'Tuesday':
         starting_id = day_id - 1
         ending_id = day_id + 5;
         break;
      case 'Wednesday':
         starting_id = day_id - 2
         ending_id = day_id + 4;
         break;
      case 'Thursday':
         starting_id = day_id - 3
         ending_id = day_id + 3;
         break;
      case 'Friday':
         starting_id = day_id - 4
         ending_id = day_id + 2;
         break;
      case 'Saturday':
         starting_id = day_id - 5
         ending_id = day_id + 1;
         break;
      case 'Sunday':
         starting_id = day_id - 6
         ending_id = day_id;
         break;
      default:
        return console.log('ERROR');
    }

    const query = `SELECT * FROM calendars WHERE day_id BETWEEN $1 AND $2 AND user_id = $3 ORDER BY day_id ASC`;
    const values = [starting_id, ending_id, user_id]
    const results = await pool.query(query, values);
    return results.rows;
 }


 async function removeRecipeFromCalendar(user_id, recipe_id, day_id){
   const query = `UPDATE calendars
            SET recipe_ids = array_remove(recipe_ids, $1)
            WHERE user_id = $2
            AND day_id = $3`;
   const values = [recipe_id, user_id, day_id];
   await pool.query(query, values);
 }

 async function updateUserImage(user_id, image){
   const query = `UPDATE users SET profile_img = $2 WHERE id = $1`;
   const values = [user_id, image];
   await pool.query(query, values);
 }

 async function getUserCreatedrecipes(user_id){
   const query = `SELECT * FROM recipes WHERE user_id = $1`;
   const results = await pool.query(query, [user_id]);
   return results.rows;
 }

 async function getYearsAvailable(){
   const query = `SELECT MIN(year), MAX(year) FROM calendars`;
   const results =  await pool.query(query);
   return results.rows;
 }

 async function updateRecipe(id, updates){
   console.log(updates);
   let paramList = [];
   let paramValues = [];
   let query = `UPDATE recipes SET `
   if(updates.title){
      paramList.push('title');
      paramValues.push(updates.title);
   }
   if(updates.ingredients){
      paramList.push('ingredients');
      paramValues.push(updates.ingredients);
   }
   if(updates.directions){
      paramList.push('directions');
      paramValues.push(updates.directions);
   }
   if(updates.tags){
      paramList.push('tag_ids');
      paramValues.push(updates.tags);
   }
   if(updates.image){
      paramList.push('image')
      paramValues.push(updates.image);
   }
   if (paramList.length === 0 || paramValues.length === 0){
      return;
   }

   else {
      let i;
      for (i = 0; i < paramList.length; i++){
         if (i === 0){
            query = `${query}${paramList[i]} = $${i + 1}`;
            continue;
         }
        query = `${query}, ${paramList[i]} = $${i + 1}`;
      }
      query = `${query} WHERE id = $${i + 1}`;
   }
   paramValues.push(id);
   console.log(query);
   console.log(paramValues.length);
   await pool.query(query, paramValues);
 }

async function createList(userId, title, listItems){
   const query = `INSERT INTO lists (user_id, title, items) VALUES($1, $2, $3)`;
   const values = [userId, title, listItems];
   await pool.query(query, values);
   const retrieveQuery = `SELECT id FROM lists WHERE user_id = $1 ORDER BY id DESC LIMIT 1`
   const newList = await pool.query(retrieveQuery, [userId]);
   return newList.rows[0]
}

async function getListsByUserId(userId){
   const query = `SELECT * FROM lists WHERE user_id = $1`;
   const newList = await pool.query(query, [userId]);
   return newList.rows;
}

async function getListByListId(listId){
   const query = `SELECT * FROM lists WHERE id = $1`;
   const list = await pool.query(query, [listId]);
   return list.rows[0]; 
} 

async function updateItems(listId, items){
   const query = `UPDATE lists SET items = $2 WHERE id = $1`;
   const values = [listId, items];
   await pool.query(query, values);
}

async function deleteList(listId){
   const query = 'DELETE FROM lists WHERE id = $1';
   await pool.query(query, [listId]);
}

const queries = {
   findUserByUsername: findUserByUsername,
   createUser: createUser,
   findUserByEmail: findUserByEmail,
   findUserById: findUserById,
   allEmails: allEmails,
   addRecipe: addRecipe,
   addToCalendar:addToCalendar,
   getAllRecipes: getAllRecipes,
   getRecipesContaining: getRecipesContaining,
   getRecipesByTag: getRecipesByTag,
   getRecipeById:getRecipeById,
   getMultipleRecipesById: getMultipleRecipesById,
   getTagsByType: getTagsByType,
   getTagsById:getTagsById,
   getAllTags:getAllTags,
   populateCalendarForNewUser:populateCalendarForNewUser,
   getDayId:getDayId,
   getUserWeek:getUserWeek,
   removeRecipeFromCalendar:removeRecipeFromCalendar,
   getRecipeIdsByMonth:getRecipeIdsByMonth,
   updateUserImage: updateUserImage,
   getUserCreatedrecipes: getUserCreatedrecipes,
   getYearsAvailable: getYearsAvailable,
   getnewRecipes: getnewRecipes,
   updateRecipe: updateRecipe,
   getRecipesByUserId: getRecipesByUserId,
   createList: createList,
   getListsByUserId: getListsByUserId,
   getListByListId: getListByListId,
   updateItems: updateItems,
   deleteList: deleteList
}

module.exports = queries;