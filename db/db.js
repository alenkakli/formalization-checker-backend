const { Pool } = require('pg');
const {
  DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME
} = require('../config');

const pool = new Pool({
  user: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME
});

module.exports = pool;
