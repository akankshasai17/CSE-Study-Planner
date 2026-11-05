const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Subject = require('../models/Subject');
const LeetCodeProblem = require('../models/LeetCodeProblem');
const { starterLeetCodeProblems, starterCoreSubjects } = require('../data/starterData');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'csestudyplanner_super_secret_jwt_key_2026',
    { expiresIn: '7d' }
  );
};

// Cookie options for secure HttpOnly cookie
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Seed starter data for a newly registered student
const seedUserData = async (userId) => {
  try {
    await Promise.all([
      (async () => {
        const count = await Subject.countDocuments({ user: userId });
        if (count === 0) {
          const docs = starterCoreSubjects.map((s) => ({
            ...s,
            user: userId,
          }));
          await Subject.insertMany(docs);
        }
      })(),
      (async () => {
        const count = await LeetCodeProblem.countDocuments({ user: userId });
        if (count === 0) {
          const docs = starterLeetCodeProblems.map((p) => ({
            ...p,
            user: userId,
            status: 'Not Started',
          }));
          await LeetCodeProblem.insertMany(docs);
        }
      })(),
    ]);
  } catch (err) {
    console.error('Warning: Error seeding initial student data:', err.message);
  }
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email address, and password.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    const sanitizedEmail = email.toLowerCase().trim();

    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Check for duplicate email
    const userExists = await User.findOne({ email: sanitizedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // Create user (bcrypt pre-save hook hashes password)
    const user = await User.create({
      name: name.trim(),
      email: sanitizedEmail,
      password,
      weeklyGoalHours: 15,
    });

    // Seed initial syllabus and starter LeetCode questions
    await seedUserData(user._id);

    const token = generateToken(user._id);

    // Set HttpOnly Cookie
    res.cookie('token', token, getCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        weeklyGoalHours: user.weeklyGoalHours,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error details:', error);

    // Handle duplicate key error code 11000 gracefully as 400
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

// @desc    Authenticate student & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    // Ensure user has starter data if not already present
    await seedUserData(user._id);

    const token = generateToken(user._id);

    // Set HttpOnly Cookie
    res.cookie('token', token, getCookieOptions());

    return res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        weeklyGoalHours: user.weeklyGoalHours || 15,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error details:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during sign in.',
    });
  }
};

// @desc    Log out current student
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({
    success: true,
    message: 'Signed out successfully.',
  });
};

// @desc    Get currently logged in student profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await seedUserData(user._id);

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        weeklyGoalHours: user.weeklyGoalHours || 15,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student profile & weekly goal
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, weeklyGoalHours, currentPassword, newPassword } = req.body;

    if (name) user.name = name.trim();
    if (weeklyGoalHours) user.weeklyGoalHours = Number(weeklyGoalHours);

    if (email) {
      const sanitized = email.toLowerCase().trim();
      if (sanitized !== user.email) {
        const existing = await User.findOne({ email: sanitized });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists.',
          });
        }
        user.email = sanitized;
      }
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current password to set a new password.',
        });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.',
        });
      }
      user.password = newPassword;
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        weeklyGoalHours: user.weeklyGoalHours,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updateProfile,
};
