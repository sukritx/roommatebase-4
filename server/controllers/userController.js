const User = require('../models/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
    const updates = req.body; // e.g., { firstName: 'New Name', bio: '...' }

    // Optional: Filter allowed updates for security
    const allowedUpdates = [
      'username', 'firstName', 'lastName', 'age', 'gender', 'location',
      'bio', 'budget', 'preferredRoommateGender', 'interests', 'isSmoker',
      'hasPet', 'occupation', 'profilePicture'
    ];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, { new: true, runValidators: true }).select('-password');

    if (!user) {
      return next(new ErrorHandler(404, 'User not found'));
    }

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (err) {
    next(err);
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