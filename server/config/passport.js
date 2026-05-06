const passport = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const TwitterStrategy = require("passport-twitter").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const User = require("../models/User");

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select("-password");
        if (!user) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Twitter OAuth Strategy
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CLIENT_ID,
      consumerSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, token, tokenSecret, profile, done) => {
      try {
        const userId = req.user?.id;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            "connectedAccounts.twitter": {
              id: profile.id,
              username: profile.username,
              token,
              tokenSecret,
            },
          });
          return done(null, req.user);
        }
        let user = await User.findOne({ "connectedAccounts.twitter.id": profile.id });
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: `twitter_${profile.id}@placeholder.com`,
            connectedAccounts: { twitter: { id: profile.id, username: profile.username, token, tokenSecret } },
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// LinkedIn OAuth Strategy
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ["r_emailaddress", "r_liteprofile", "w_member_social"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const userId = req.user?.id;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            "connectedAccounts.linkedin": {
              id: profile.id,
              name: profile.displayName,
              accessToken,
            },
          });
          return done(null, req.user);
        }
        let user = await User.findOne({ "connectedAccounts.linkedin.id": profile.id });
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails?.[0]?.value || `linkedin_${profile.id}@placeholder.com`,
            connectedAccounts: { linkedin: { id: profile.id, name: profile.displayName, accessToken } },
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);
