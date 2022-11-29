const jwt = require("jsonwebtoken");
const {TOKEN_SECRET} = require("../config");

/* Vyhodit, nahradit req.user za req.auth */
// const authenticateJWT = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     const token = authHeader.split(' ')[1];
//
//     if (token == null) return res.sendStatus(401)
//
//     jwt.verify(token, TOKEN_SECRET, (err, user) => {
//         if (err) return res.sendStatus(403);
//
//         req.auth = user;
//         next();
//     });
// };

function generateAccessToken(user) {
    let oneDay = 24* 3600 * 30;
    return jwt.sign(user, TOKEN_SECRET, { expiresIn: oneDay + 's' });
}

function isAdmin(req) {
    return req.auth.isAdmin
}

/* middleware, ktory overi, ci je user admin; ak nie, vrati 403, inak zavola next() --
   Pouzit pre tie routes, ku ktorym ma mat pristup iba admin
 */
const authAdmin = (req, res, next) => {
    if (!isAdmin(req)) return res.sendStatus(401);
    next();
};

module.exports = { generateAccessToken, isAdmin, authAdmin }
