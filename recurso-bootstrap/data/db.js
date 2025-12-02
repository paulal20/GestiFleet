// const mysql = require('mysql2');

// const pool = mysql.createPool({
//   connectionLimit: 10,
//   host: 'localhost',
//   user: 'root',
//   password: 'root',
//   database: 'gestifleetBD'
// });

// module.exports = pool;

const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  port: 3307,
  user: 'root',
  password: '',
  database: 'gestifleetbd'
});

module.exports = pool;