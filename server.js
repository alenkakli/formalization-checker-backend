const { use } = require('express/lib/router');
const express = require('express');
const cors = require('cors');
const { PORT, TOKEN_SECRET } = require('./config');
const cookieParser = require('cookie-parser');

const server = express();

server.use(cookieParser());
server.use(cors());
server.use(express.json());

server.use('/api/exercises', require('./routes/api/exercises'));

server.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`);
});
