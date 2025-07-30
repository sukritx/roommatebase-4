// config/passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.model'); // Ensure this path is correct

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback" // This must match your backend route
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        return done(null, user);
      }

      // Create new user if not found
      // Ensure 'password' field is handled, it's required in your schema
      // For OAuth, generate a random password or mark it as a social login
      user = new User({
        username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substr(2, 5),
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profilePicture: profile.photos[0].value,
        // CRITICAL: Your User schema requires a 'password'.
        // For Google OAuth, you'll need a placeholder or a different authentication strategy.
        // A common approach is to generate a random password for social users
        // or add a field like `isSocialLogin: true` and make password non-required if `isSocialLogin` is true.
        // For simplicity, I'll generate a random string as password here.
        password: 'social-login-password-' + Math.random().toString(36).substring(2, 15) + Date.now(),
        userType: 'User', // Default for new users via OAuth
        isRoomOwner: false, // Default for new users via OAuth
      });

      await user.save();
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));

  // Passport serializeUser: Stores user ID in the session
  passport.serializeUser((user, done) => {
    done(null, user.id); // Use user.id (Mongoose document _id property)
  });

  // Passport deserializeUser: Retrieves user from the session
  passport.deserializeUser(async (id, done) => { // <--- Made this an async function
    try {
      const user = await User.findById(id); // <--- Removed callback, now uses await
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};