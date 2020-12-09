const express = require('express');
const cors = require('cors');

const server = express();

const PORT = process.env.PORT || 5000;

// middleware
server.use(cors());
server.use(express.json());

server.use('/addExercise', require('./routes/addExercise'));


server.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`);
});
