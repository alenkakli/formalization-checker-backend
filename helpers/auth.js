const jwt = require("jsonwebtoken");
const {TOKEN_SECRET} = require("../config");

function generateAccessToken(user) {
    let oneDay = 24* 3600 * 30;
    return jwt.sign(user, TOKEN_SECRET, { expiresIn: oneDay + 's' });
}

function isAdmin(req) {
    return req.auth.isAdmin;
}

const authAdmin = (req, res, next) => {
    if (!isAdmin(req)) return res.sendStatus(401);
    next();
};

module.exports = { generateAccessToken, isAdmin, authAdmin }
