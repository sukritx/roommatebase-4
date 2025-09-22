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
    const userId = req.user._id; // Get user ID from authenticated token
    const {
      username, // New username from request
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
    } = req.body;

    const updateFields = {};

    // --- Username Uniqueness Check ---
    if (username !== undefined) {
      // If the username is being changed, check if it's taken by another user
      const existingUserWithUsername = await User.findOne({ username: username });

      if (existingUserWithUsername && existingUserWithUsername._id.toString() !== userId.toString()) {
        // If an existing user is found AND their ID is NOT the current user's ID
        // Use the imported ErrorHandler to create a custom error
        return next(new ErrorHandler(409, 'Username is already taken. Please choose a different one.')); // 409 Conflict
      }
      updateFields.username = username; // Only set if unique or unchanged
    }
    // --- End Username Uniqueness Check ---

    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (age !== undefined) updateFields.age = age === null ? null : Number(age);
    if (location !== undefined) updateFields.location = location;
    if (bio !== undefined) updateFields.bio = bio;
    if (budget !== undefined) updateFields.budget = budget === null ? null : Number(budget);
    if (interests !== undefined) updateFields.interests = interests;
    if (isSmoker !== undefined) updateFields.isSmoker = isSmoker;
    if (hasPet !== undefined) updateFields.hasPet = hasPet;
    if (occupation !== undefined) updateFields.occupation = occupation;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

    // --- Specific handling for enum fields (gender, preferredRoommateGender) ---
    if (gender !== undefined && gender !== '') {
      updateFields.gender = gender;
    }

    if (preferredRoommateGender !== undefined && preferredRoommateGender !== '') {
      updateFields.preferredRoommateGender = preferredRoommateGender;
    }
    // --- End enum handling ---

    const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true, runValidators: true })
      .select('-password'); // Exclude password from the response

    if (!updatedUser) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    // Handle Mongoose validation errors (e.g., if a field becomes required or an enum fails)
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return next(new ErrorHandler(400, messages.join(', ')));
    }
    console.error("Error in updateProfile:", err);
    next(err); // Pass other errors to the generic error handler
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

exports.updateContact = async (req, res, next) => { // This function likely needs to be renamed or re-purposed
  try {
    const userId = req.user._id;
    const { facebook, instagram, twitter, whatsapp, phoneNumber } = req.body;

    const contactInfo = { // Renamed from socialMedia to contactInfo to match model
      facebook: facebook || '',
      instagram: instagram || '',
      twitter: twitter || '',
      whatsapp: whatsapp || '',
      phoneNumber: phoneNumber || ''
    };

    const user = await User.findByIdAndUpdate(userId, {
      contact: [contactInfo] // CHANGED: from socialMedia to contact
    }, { new: true, runValidators: true }).select('-password');

    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    res.json({ success: true, message: 'Contact information updated successfully', contact: user.contact[0] }); // CHANGED
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