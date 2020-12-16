const express = require('express');
const cors = require('cors');

const server = express();

const PORT = process.env.PORT || 5000;

// middleware
server.use(cors());
server.use(express.json());

server.use('/api/exercises', require('./routes/api/exercises'));
server.use('/api/propositions', require('./routes/api/propositions'));
server.use('/api/formalizations', require('./routes/api/formalizations'));

server.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`);
});
