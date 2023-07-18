const Pool = require('pg').Pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'K&Hb4e25eHZI',
  port: 5432,
});

module.exports = pool;