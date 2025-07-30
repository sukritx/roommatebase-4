// server/config/passport.js

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.model');

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // Optional: Update existing user's profile picture or name if it changes on Google
        // if (profile.photos && profile.photos[0] && user.profilePicture !== profile.photos[0].value) {
        //   user.profilePicture = profile.photos[0].value;
        //   await user.save();
        // }
        return done(null, user);
      }

      // Generate a simple base username from email or display name, then add randomness
      const baseUsername = profile.emails && profile.emails[0] ? profile.emails[0].value.split('@')[0] : profile.displayName.replace(/\s+/g, '').toLowerCase();
      const uniqueSuffix = Math.random().toString(36).substr(2, 5); // Short random string
      const finalUsername = `${baseUsername.replace(/[^a-zA-Z0-9]/g, '')}${uniqueSuffix}`; // Remove special chars from base

      const newUser = new User({
        username: finalUsername, // Improved username generation
        email: profile.emails[0].value,
        firstName: profile.name.givenName || '', // Add fallback
        lastName: profile.name.familyName || '', // Add fallback
        profilePicture: (profile.photos && profile.photos[0] && profile.photos[0].value) || '', // Add fallback
        password: 'social-login-password-' + Math.random().toString(36).substring(2, 20), // Stronger random string
        userType: 'User',
        isRoomOwner: false,
        // Ensure all other required fields have a default or are optional in your schema:
        // age: null,
        // gender: null,
        // location: '',
        // bio: '',
        // budget: 0,
        // preferredRoommateGender: 'Any',
        // interests: [],
        // isSmoker: false,
        // hasPet: false,
        // occupation: '',
        // listedRooms: [],
        // favoriteRooms: [],
        // joinedParty: null,
        // socialMedia: [],
        // isPaid: false,
        // paidUntil: null,
        // freeQuotaUsed: 0,
      });

      await newUser.save();
      return done(null, newUser);
    } catch (err) {
      console.error("Error in Google OAuth strategy:", err); // Log the error for debugging
      return done(err, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      console.error("Error deserializing user:", err); // Log the error for debugging
      done(err, null);
    }
  });
};