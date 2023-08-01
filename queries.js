const pool = require('./connection');


async function createUser(user){
   try{
      let query = 'INSERT INTO public.users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4)';
      const values = [user.firstname, user.lastname, user.email, user.password];

      await pool.query(query, values);
      query = 'SELECT * FROM public.users WHERE email = $1::varchar';
      const newUser = await pool.query(query, [user.email]);
      return newUser;

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
   query = 'SELECT * FROM public.users WHERE id = $1::varchar';
   const results = await pool.query(query, [id]);
   if (results.rows.length > 1){
      console.log('duplicate id!');
   }
   const user = results.rows[0];
   return user;
}

async function addMeal(meal, user_id, image, time){
   try{
      let query = 'INSERT INTO public.meals (user_id, title, ingredients, directions, tag_ids, image, time) VALUES ($1, $2, $3, $4, $5, $6, $7)';
      const values = [user_id, meal.title, meal.ingredients, meal.directions, meal.tags, image, time];

      await pool.query(query, values);

      query = 'SELECT * FROM public.meals WHERE user_id = $1::integer ORDER BY time DESC';
      const newMeal = await pool.query(query, [user_id]);
      return newMeal.rows[0];

   }catch(err){
      console.log(err);
   }
}

// async function getMealImage(){
//    'SELECT image FROM meals WHERE id = $1::varchar'
// }

async function getAllMeals(){
   let query = `SELECT * FROM meals`;
   const results = await pool.query(query);
   return results.rows;
}

async function getTags(input){
   let query = `SELECT * from tags WHERE type = $1`;
   const results = await pool.query(query, [input]);
   return results.rows;
}

const queries = {
   createUser: createUser,
   findUserByEmail: findUserByEmail,
   findUserById: findUserById,
   allEmails: allEmails,
   addMeal: addMeal,
   getAllMeals: getAllMeals,
   getTags: getTags
}

module.exports = queries;