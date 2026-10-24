const mysql = require('mysql2/promise');
module.exports = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3307),
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DATABASE,
  password: process.env.MYSQL_PASSWORD,
  connectionLimit: 5,
  charset: 'utf8mb4',
  multipleStatements: false,
});
