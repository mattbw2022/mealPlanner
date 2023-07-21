const pg = require('pg');
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

async function findUserById(id){
   query = 'SELECT * FROM public.users WHERE id = $1::varchar';
   const results = await pool.query(query, [id]);
   if (results.rows.length > 1){
      console.log('duplicate id!');
   }
   const user = results.rows[0];
   return user;
}

const queries = {
   createUser: createUser,
   findUserByEmail: findUserByEmail,
   findUserById: findUserById
}

module.exports = queries;