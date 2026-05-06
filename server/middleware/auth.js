const passport = require("passport");
const jwt = require("jsonwebtoken");

const protect = passport.authenticate("jwt", { session: false });

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const optionalAuth = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    req.user = user || null;
    next();
  })(req, res, next);
};

module.exports = { protect, generateToken, optionalAuth };
