const jwt = require("jsonwebtoken");
const {TOKEN_SECRET} = require("../config");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

function generateAccessToken(user) {
    let oneDay = 24* 3600 * 30;
    return jwt.sign(user, TOKEN_SECRET, { expiresIn: oneDay + 's' });
}

function isAdmin(token) {
    let t = JSON.parse(Buffer.from(token.split(" ")[1].split(".")[1], "base64").toString());
    return t.isAdmin;
}

module.exports = { authenticateJWT, generateAccessToken, isAdmin }
