const pg = require('pg');
const pool = require('./connection');

 
async function query (pool, query){
    try {
        const res = await pool.query(query);
        console.log(res.rows)
     } catch (err) {
        console.error(err);
     } finally {
        await pool.end()
     }
}

async function createUser(user){
   
   try{
      await pool.query(`INSERT users (firstname, lastname, email, password) VALUES(${user.firstname}, ${user.lastname}, ${user.email}, ${user.password})`)

   }catch(err){
      console.log(err);
   }
}

// const getUsers = async (request, response) => {
//    pool.query('SELECT * FROM users ORDER BY id ASC', (error, results) => {
//      if (error) {
//        throw error
//      }
//      response.status(200).json(results.rows)
//    })
//  }

const queries = {
   createUser: createUser(),
}

modules.export = queries;