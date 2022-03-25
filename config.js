const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  PORT: process.env.PORT,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  PATH_TO_VAMPIRE: process.env.PATH_TO_VAMPIRE,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  SECRET_KEY: process.env.REACT_APP_SECRET_KEY,
  ADMIN_NAME: process.env.ADMIN_NAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};
