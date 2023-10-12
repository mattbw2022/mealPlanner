const pool = require('./connection');
const {isLeapYear} = require('./calendar');
const logger = require('./logger');

async function createUser(user){
   let securityQuestion;
   if (user.securityQuestion){
      securityQuestion = user.securityQuestion;
   }
   else{
      securityQuestion = user.customQuestion;
   }
   try{
      const query1 = 'INSERT INTO public.users (firstname, lastname, email, password, username, security_question, security_answer) VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const values = [user.firstname, user.lastname, user.email, user.password, user.username, securityQuestion, user.securityAnswer];

      await pool.query(query1, values);
      const query2 = 'SELECT * FROM public.users WHERE email = $1::varchar';
      const newUser = await pool.query(query2, [user.email]);
      return newUser.rows[0];

   }catch(err){
      logger.error(err);
   }
}

async function updateUser(id, updates){
   let paramList = [];
   let paramValues = [];
   let query = `UPDATE users SET `
   if(updates.firstname){
      paramList.push('firstname');
      paramValues.push(updates.firstname);
   }
   if(updates.lastname){
      paramList.push('lastname');
      paramValues.push(updates.lastname);
   }
   if(updates.username){
      paramList.push('username');
      paramValues.push(updates.username);
   }
   if(updates.email){
      paramList.push('email');
      paramValues.push(updates.email);
   }
   if(updates.password){
      paramList.push('password')
      paramValues.push(updates.password);
   }
   if(updates.securityQuestion){
      paramList.push('security_question');
      paramValues.push(updates.securityQuestion);
   }
   if(updates.securityAnswer){
      paramList.push('security_answer')
      paramValues.push(updates.securityAnswer);
   }
   if(paramList.length === 0 || paramValues.length === 0){
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
   await pool.query(query, paramValues);
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
   try {
      const query = 'SELECT * FROM public.users WHERE id = $1::integer';
      const results = await pool.query(query, [id]);
      const user = results.rows[0];
      return user;      
   } catch (error) {
      logger.error(error);  
   }
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
   }
   catch(error){
      logger.error(error);
   }  
}

async function addRecipe(recipe, user_id, image, time){
   let tagIds;
   try{
      if (recipe.tags){
         if (Array.isArray(recipe.tags)){
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
      logger.error(err);
   }
}

async function getAllRecipes(){
   try {
      const query = `SELECT * FROM recipes`;
      const results = await pool.query(query);
      return results.rows;      
   } catch (error) {
      logger.error(error);
   }

}

async function getTagsByType(input){
   const  query = `SELECT * from tags WHERE type = $1 ORDER BY name`;
   const results = await pool.query(query, [input]);
   return results.rows;
}

async function getTagsById(tag_id){
   try {
      const query = `SELECT * FROM tags WHERE id = $1`;
      const results = await pool.query(query, [tag_id]);
      return results.rows;  
   } catch (error) {
      throw new Error('Unable to get tags by id from tags table');
   }
}

async function getAllTags(){
   try {
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
   } catch (error) {
      throw new Error('Unable to get all tags from tags table.');  
   }
 }

async function populateCalendarForNewUser(userId, date) {
   const startYear = date.year;
   const endYear = date.year + 2;
   let dayId = 1;
   
   for (let year = startYear; year <= endYear; year++) {
     for (let month = 1; month <= 12; month++) {
       let daysInMonth = 31;
 
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

 async function updateCalendars(year, userId){
   const startYear = year;
   const currentMaxDayId = await pool.query('SELECT day_id FROM calendars ORDER BY day_id DESC LIMIT 1');
   let dayId = parseInt(currentMaxDayId);
   dayId = dayId + 1;
   
   for (let year = startYear; year <= endYear; year++) {
     for (let month = 1; month <= 12; month++) {
       let daysInMonth = 31;
 
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
   // query to delete the oldest year.
 }

 async function getDayId(date){
   try {
      const query = `SELECT day_id FROM calendars WHERE year = $1 AND month = $2 AND day = $3 LIMIT 1`;
      const values = [date.year, date.month, date.day]
      const results = await pool.query(query, values);
      return results.rows[0].day_id;  
   } catch (error) {
      throw new Error('Unable to get day_id from calendars table');
   }
 }

 async function getRecipeIdsByMonth(year, month, user_id){
   try {
      const query = `SELECT recipe_ids FROM calendars WHERE year = $1 AND month = $2 AND user_id = $3 ORDER BY day`;
      const values = [year, month, user_id];
      const results = await pool.query(query, values);
   return results.rows;      
   } catch (error) {
      throw new Error('Unable to get recipe ids by month');
   }

 }

 async function getRecipeById(id){
   try {
      const query = `SELECT * FROM recipes WHERE id = $1`;
      const results = await pool.query(query, [id]);
      return results.rows[0];
   } catch (error) {
      throw new Error('Unable to get recipe by id from recipes table.');   
   }
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
   try {
      const query = `
      SELECT *
      FROM recipes
      WHERE title LIKE $1
        OR EXISTS (
          SELECT 1
          FROM unnest(ingredients) AS json_str
          WHERE json_str::json->>'ingredient' ILIKE $1
        )
    `;
    
      const results = await pool.query(query, [`%${search}%`]);
      return results.rows;      
   } catch (error) {
      throw new Error(`Unable to get recipes containing ${search} from recipes.`);  
   }
 }

 async function getRecipesByTag(tag_arr){
      let tagIds;
      try{
         if (tag_arr){
            if (tag_arr.length > 1){
               tagIds = tag_arr.map(tag => parseInt(tag, 10)); 
            }
            else{
               tagIds = [parseInt(tag_arr, 10)];
            }
         }
         const query = `SELECT * FROM recipes WHERE tag_ids && $1`
         const results = await pool.query(query, [tagIds]);
         return results.rows;
         
      }
      catch(err){
         logger.error(err)
      }
 }

 async function getnewRecipes(){
   try {
      const query = 'SELECT * FROM recipes ORDER BY time DESC LIMIT 10';
      const results = await pool.query(query);
      return results.rows;      
   } catch (error) {
      throw new Error('Unable to get new recipes form recipes table');
   }

 }

 async function getUserWeek(day_id, user_id, dayOfWeek){
   try {
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
         return logger.error('ERROR');
      }

      const query = `SELECT * FROM calendars WHERE day_id BETWEEN $1 AND $2 AND user_id = $3 ORDER BY day_id ASC`;
      const values = [starting_id, ending_id, user_id]
      const results = await pool.query(query, values);
      return results.rows;
   } catch (error) {
      throw new Error(`Unable to gather user week for user id ${user_id}`);
   }
 }


 async function removeRecipeFromCalendar(user_id, recipe_id, day_id){
   try {
      const query = `UPDATE calendars
         SET recipe_ids = array_remove(recipe_ids, $1)
         WHERE user_id = $2
         AND day_id = $3`;
      const values = [recipe_id, user_id, day_id];
      await pool.query(query, values);  
   } catch (error) {
    throw new Error(`Unable to remove recipe from calendar for user id ${user_id}`);  
   }
 }

 async function updateUserImage(user_id, image){
   try {
      const query = `UPDATE users SET profile_img = $2 WHERE id = $1`;
      const values = [user_id, image];
      await pool.query(query, values);  
   } catch (error) {
      throw new Error(`Unable to update user image for user id ${user_id} in users table.`);
   }
 }

 async function getUserCreatedrecipes(user_id){
   try {
      const query = `SELECT * FROM recipes WHERE user_id = $1`;
      const results = await pool.query(query, [user_id]);
      return results.rows;
   } catch (error) {
      throw new Error('Unable to get user created recipes from recipes table.');
   }
 }

 async function getYearsAvailable(){
   try {
      const query = `SELECT MIN(year), MAX(year) FROM calendars`;
      const results =  await pool.query(query);
      return results.rows;  
   } catch (error) {
      throw new Error('Unabel to get available years from calendars table.');
   }
 }

 async function updateRecipe(id, updates){
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
   if(paramList.length === 0 || paramValues.length === 0){
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
   try {
      await pool.query(query, paramValues);
   } catch (error) {
      throw new Error('Unable to update recipe in recipes table.')
   }
 }

async function createList(userId, title, listItems){
   try {
      const query = `INSERT INTO lists (user_id, title, items) VALUES($1, $2, $3)`;
      const values = [userId, title, listItems];
      await pool.query(query, values);  
      const retrieveQuery = `SELECT id FROM lists WHERE user_id = $1 ORDER BY id DESC LIMIT 1`
      const newList = await pool.query(retrieveQuery, [userId]);
      return newList.rows[0]    
   } catch (error) {
      throw new Error('Unable to create or retrive new list in lists table');
   }
}

async function getListsByUserId(userId){
   try {
      const query = `SELECT * FROM lists WHERE user_id = $1`;
      const newList = await pool.query(query, [userId]);
      return newList.rows;  
   } catch (error) {
      throw new Error('Unable to get lists by user_id from lists table');
   }
}

async function getListByListId(listId){
   try {
      const query = `SELECT * FROM lists WHERE id = $1`;
      const list = await pool.query(query, [listId]);
      return list.rows[0];   
   } catch (error) {
      throw new Error('Unable to get list by id from lists table');
   }
} 

async function updateItems(listId, items){
   try {
      const query = `UPDATE lists SET items = $2 WHERE id = $1`;
      const values = [listId, items];
      await pool.query(query, values);
   return;      
   } catch (error) {
      throw new Error('Unable to update list items in lists table.');
   }
}

async function deleteList(listId){
   try {
      const query = 'DELETE FROM lists WHERE id = $1';
      await pool.query(query, [listId]);
      return;  
   } catch (error) {
      throw new Error('Unable to delete list from lists table');
   }
}

async function getAllByColumn(column, table){
   try {
      const query = `SELECT ${column} FROM ${table}`;
      const results = await pool.query(query);
      return results.rows;  
   } catch (error) {
      throw new Error(`Unable to get all from ${column} in ${table} table.`);
   }
}

async function deleteUser(id){
   try {
      const query = 'DELETE FROM users WHERE id = $1';
      await pool.query(query, [id]);
      return;      
   } catch (error) {
      throw new Error(`Unable to delete user with id ${id} from users table.`);
   }

}

async function getMaxOrMinYear(user_id, needMax){
   if(needMax){
      const query = 'SELECT MAX(year) FROM calendars WHERE user_id = $1'
      const maxAge = await pool.query(query, [user_id]);
      return maxAge.rows[0].max;
   }
   else{
      const query = 'SELECT MIN(year) FROM calendars WHERE user_id = $1'
      const minAge = await pool.query(query, [user_id]);
      return minAge.rows[0].min;
   }
   
}

async function getRecipeByTitle(title){
   const result = await pool.query('SELECT title FROM recipes WHERE title = $1', [title]);
   return result.rows;
}
async function handleFavorites(id, favorites){
   try {
      await pool.query('UPDATE users SET favorites = $1 WHERE id = $2', [favorites, id]);

   } catch (error) {
      throw new Error(error);
   }
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
   deleteList: deleteList,
   getAllByColumn: getAllByColumn,
   updateUser: updateUser,
   deleteUser: deleteUser,
   updateCalendars: updateCalendars,
   getMaxOrMinYear: getMaxOrMinYear,
   handleFavorites: handleFavorites,
   getRecipeByTitle: getRecipeByTitle,
}

module.exports = queries;