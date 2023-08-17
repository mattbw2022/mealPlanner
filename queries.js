const pool = require('./connection');
const {isLeapYear} = require('./calendar');


async function createUser(user){
   try{
      let query = 'INSERT INTO public.users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4)';
      const values = [user.firstname, user.lastname, user.email, user.password];

      await pool.query(query, values);
      query = 'SELECT * FROM public.users WHERE email = $1::varchar';
      const newUser = await pool.query(query, [user.email]);
      return newUser.rows[0];

   }catch(err){
      console.log(err);
   }
}

async function findUserByEmail(email){
   query = 'SELECT * FROM public.users WHERE email = $1::varchar';
   const results = await pool.query(query, [email]);
   if (results.rows.length > 1){
      console.log('duplicate emails!');
   }
   const user = results.rows[0];
   return user;
}

async function allEmails(){
   query = 'SELECT email FROM users';
   const results = await pool.query(query);
   return results;
}

async function findUserById(id){
   query = 'SELECT * FROM public.users WHERE id = $1::integer';
   const results = await pool.query(query, [id]);
   if (results.rows.length > 1){
      console.log('duplicate id!');
   }
   const user = results.rows[0];
   return user;
}

async function addToCalendar(day, month, year, user_id, meal_id){
   try{
         let query = `UPDATE calendars
         SET meal_ids = array_append(meal_ids, $1)
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

async function addMeal(meal, user_id, image, time){
   let tagIds;
   try{
      if (meal.tags){
         if (meal.tags.length > 1){
            tagIds = meal.tags.map(tag => parseInt(tag, 10)); 
         }
         else{
            tagIds = [parseInt(meal.tags, 10)];
         }
      }

      query = 'INSERT INTO public.meals (user_id, title, ingredients, directions, tag_ids, image, time) VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const values = [user_id, meal.title, meal.ingredients, meal.directions, tagIds, image, time];

      await pool.query(query, values);

      query = 'SELECT * FROM public.meals WHERE user_id = $1::integer ORDER BY time DESC';
      const newMeal = await pool.query(query, [user_id]);
      return newMeal.rows[0];

   }catch(err){
      console.log(err);
   }
}

async function getAllMeals(){
   let query = `SELECT * FROM meals`;
   const results = await pool.query(query);
   return results.rows;
}

async function getTagsByType(input){
   let query = `SELECT * from tags WHERE type = $1`;
   const results = await pool.query(query, [input]);
   return results.rows;
}

async function getTagsById(tag_id){
   let query = `SELECT * FROM tags WHERE id = $1`;
   const results = await pool.query(query, [tag_id]);
   console.log(results.rows);
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
   let query = `SELECT day_id FROM calendars WHERE year = $1 AND month = $2 AND day = $3 LIMIT 1`;
   const values = [date.year, date.month, date.day]
   const results = await pool.query(query, values);
   return results.rows[0].day_id;
 }

 async function getMealById(meal_id){
   let query = `SELECT * FROM meals WHERE id = $1`;
   const results = await pool.query(query, [meal_id]);
   return results.rows[0];
 }

 async function getMealsContaining(search){
   let query = `SELECT * FROM meals
                  WHERE title LIKE $1
                  OR ingredients LIKE $1
                  OR directions LIKE $1`;
   const results = await pool.query(query, [`%${search}%`]);
   return results.rows;
 }

 async function getMealsByTag(tag_arr){
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
         let query = `SELECT * FROM meals WHERE tag_ids && $1`
         const results = await pool.query(query, [tagIds]);
         return results.rows;
         
      }
      catch(err){
         console.log(err)
      }
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
      defualt:
        return console.log('ERROR');
    }

    let query = `SELECT * FROM calendars WHERE day_id BETWEEN $1 AND $2 AND user_id = $3 ORDER BY day_id ASC`;
    const values = [starting_id, ending_id, user_id]
    const results = await pool.query(query, values);
    return results.rows;
 }

 async function removeMealFromCalendar(user_id, meal_id, day_id){
   query = `UPDATE calendars
            SET meal_ids = array_remove(meal_ids, $1)
            WHERE user_id = $2
            AND day_id = $3`;
   values = [meal_id, user_id, day_id];
   await pool.query(query, values);
 }

const queries = {
   createUser: createUser,
   findUserByEmail: findUserByEmail,
   findUserById: findUserById,
   allEmails: allEmails,
   addMeal: addMeal,
   addToCalendar:addToCalendar,
   getAllMeals: getAllMeals,
   getMealsContaining:getMealsContaining,
   getMealsByTag: getMealsByTag,
   getMealById:getMealById,
   getTagsByType: getTagsByType,
   getTagsById:getTagsById,
   getAllTags:getAllTags,
   populateCalendarForNewUser:populateCalendarForNewUser,
   getDayId:getDayId,
   getUserWeek:getUserWeek,
   removeMealFromCalendar:removeMealFromCalendar
}

module.exports = queries;