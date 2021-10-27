const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');

const server = express();

server.use(cors());
server.use(express.json());

server.use('/api/exercises', require('./routes/api/exercises'));

server.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`);
});
