const { use } = require('express/lib/router');
const express = require('express');
const cors = require('cors');
const { PORT, TOKEN_SECRET } = require('./config');
const cookieParser = require('cookie-parser');
const { expressjwt: jwt } = require('express-jwt');

const server = express();

server.use(cookieParser());
server.use(cors());
server.use(express.json());
server.use(jwt({ secret: TOKEN_SECRET, algorithms: ['HS256']})
    .unless({path: ['/api/users/login', '/api/users/login/github/auth']}));

server.use('/api/exercises', require('./routes/api/exercises'));
server.use('/api/feedbacks', require('./routes/api/feedbacks'));
server.use('/api/progress', require('./routes/api/progress'));
server.use('/api/users', require('./routes/api/users'));

server.listen(PORT, () => {
  console.log(`Server started listening on port ${PORT}`);
});
