const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ErrorHandler } = require('../middleware/errorHandler');

exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    next(err);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// New: Google OAuth Callback Handler
exports.loginWithGoogleCallback = (req, res) => {
  // Passport.js places the authenticated user on req.user
  if (!req.user) {
    return res.redirect(process.env.FRONTEND_URL + '/login?error=auth_failed');
  }

  // Generate JWT token for the user authenticated by Google
  const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

  // Redirect to your frontend with the token
  // The frontend will then store this token (e.g., in localStorage)
  res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      username,
      firstName,
      lastName,
      age,
      gender,
      location,
      bio,
      budget,
      preferredRoommateGender,
      interests,
      isSmoker,
      hasPet,
      occupation,
      profilePicture,
      // Contact fields directly from the request body
      facebook,
      instagram,
      twitter,
      whatsapp,
      phoneNumber,
    } = req.body;

    // Fetch the user document to safely update nested arrays/objects
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
        return next(new ErrorHandler(404, 'User not found'));
    }

    // --- Update scalar and simple array fields ---
    // Handle username with uniqueness check
    if (username !== undefined) {
      const existingUserWithUsername = await User.findOne({ username: username });
      if (existingUserWithUsername && existingUserWithUsername._id.toString() !== userId.toString()) {
        return next(new ErrorHandler(409, 'Username is already taken. Please choose a different one.'));
      }
      userToUpdate.username = username;
    }
    
    // Update other direct fields
    if (firstName !== undefined) userToUpdate.firstName = firstName;
    if (lastName !== undefined) userToUpdate.lastName = lastName;
    // For number fields, allow null to clear them
    if (age !== undefined) userToUpdate.age = age === null ? null : Number(age);
    // For enum fields, only update if a non-empty string is provided
    if (gender !== undefined && gender !== '') userToUpdate.gender = gender;
    if (location !== undefined) userToUpdate.location = location;
    if (bio !== undefined) userToUpdate.bio = bio;
    if (budget !== undefined) userToUpdate.budget = budget === null ? null : Number(budget);
    if (preferredRoommateGender !== undefined && preferredRoommateGender !== '') userToUpdate.preferredRoommateGender = preferredRoommateGender;
    if (interests !== undefined) userToUpdate.interests = interests;
    // Boolean fields can be directly updated if defined
    if (isSmoker !== undefined) userToUpdate.isSmoker = isSmoker;
    if (hasPet !== undefined) userToUpdate.hasPet = hasPet;
    if (occupation !== undefined) userToUpdate.occupation = occupation;
    if (profilePicture !== undefined) userToUpdate.profilePicture = profilePicture;


    // --- Handle Contact Information (nested array of objects) ---
    // Ensure the contact array exists and has at least one element for simplicity.
    // If you intend for multiple contact sets, this logic needs to be extended.
    if (!userToUpdate.contact || userToUpdate.contact.length === 0) {
        userToUpdate.contact = [{}]; // Initialize with an empty object if missing or empty
    }
    const firstContact = userToUpdate.contact[0]; // Reference the first (and assumed only) contact object

    // Update each contact field if it's explicitly provided in the request body
    if (facebook !== undefined) firstContact.facebook = facebook;
    if (instagram !== undefined) firstContact.instagram = instagram;
    if (twitter !== undefined) firstContact.twitter = twitter;
    if (whatsapp !== undefined) firstContact.whatsapp = whatsapp;
    if (phoneNumber !== undefined) firstContact.phoneNumber = phoneNumber;

    // Crucial: Mark the contact array as modified for Mongoose to detect changes
    userToUpdate.markModified('contact');
    // --- End Contact Information handling ---

    // Save the fully modified document
    const updatedUser = await userToUpdate.save();

    // Respond with the updated user data (excluding sensitive info like password)
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toObject({ virtuals: true, getters: true }), // Convert to plain object, include virtuals
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorHandler(400, messages.join(', ')));
    }
    console.error("Error in updateProfile:", err);
    next(err); // Pass any other errors to the central error handler
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { budget, preferredRoommateGender, interests, isSmoker, hasPet } = req.body;

    const user = await User.findByIdAndUpdate(userId, {
      budget,
      preferredRoommateGender,
      interests,
      isSmoker,
      hasPet,
    }, { new: true, runValidators: true }).select('-password');

    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    res.json({ success: true, message: 'Preferences updated successfully', user });
  } catch (err) {
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // In a real app, you might want a soft delete or more complex logic
    // (e.g., delete related rooms if landlord, notify associated parties etc.)
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .populate('favoriteRooms')
      .populate('joinedParty')
      .populate('listedRooms');

    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    const stats = {
      favoriteRoomsCount: user.favoriteRooms ? user.favoriteRooms.length : 0,
      joinedParty: user.joinedParty ? {
        _id: user.joinedParty._id,
        title: user.joinedParty.title,
        room: user.joinedParty.room,
        status: user.joinedParty.status
      } : null,
      listedRoomsCount: user.listedRooms ? user.listedRooms.length : 0,
      isPaid: user.isPaid,
      paidUntil: user.paidUntil,
      freeQuotaUsed: user.freeQuotaUsed, // You might want to remove this if free quota is completely gone
      userType: user.userType,
      isRoomOwner: user.isRoomOwner,
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};