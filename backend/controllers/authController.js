import User from '../models/User.js';
import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token for the user id.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter all registration fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Create user in DB (password will be hashed by pre-save schema hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          studyGoals: user.studyGoals,
          quizzesCompleted: user.quizzesCompleted,
          studyStreak: user.studyStreak,
          summariesGenerated: user.summariesGenerated,
          studyMinutes: user.studyMinutes,
          joinedDate: new Date(user.createdAt).toLocaleDateString()
        },
      });
    } else {
      res.status(400).json({ success: false, error: 'Invalid user registration data provided' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please enter email and password credentials' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password credentials' });
    }

    // Validate password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studyGoals: user.studyGoals,
        quizzesCompleted: user.quizzesCompleted,
        studyStreak: user.studyStreak,
        summariesGenerated: user.summariesGenerated,
        studyMinutes: user.studyMinutes,
        joinedDate: new Date(user.createdAt).toLocaleDateString()
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get user profile & stats
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studyGoals: user.studyGoals,
        quizzesCompleted: user.quizzesCompleted,
        studyStreak: user.studyStreak,
        summariesGenerated: user.summariesGenerated,
        studyMinutes: user.studyMinutes,
        joinedDate: new Date(user.createdAt).toLocaleDateString()
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res) => {
  const { name, studyGoals } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) user.name = name;
    if (studyGoals !== undefined) user.studyGoals = studyGoals;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studyGoals: user.studyGoals,
        quizzesCompleted: user.quizzesCompleted,
        studyStreak: user.studyStreak,
        summariesGenerated: user.summariesGenerated,
        studyMinutes: user.studyMinutes,
        joinedDate: new Date(user.createdAt).toLocaleDateString()
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update user statistics
 * @route   PUT /api/auth/stats
 * @access  Private
 */
export const updateUserStats = async (req, res) => {
  const { quizzesCompleted, studyStreak, summariesGenerated, studyMinutes } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (quizzesCompleted !== undefined) user.quizzesCompleted = quizzesCompleted;
    if (studyStreak !== undefined) user.studyStreak = studyStreak;
    if (summariesGenerated !== undefined) user.summariesGenerated = summariesGenerated;
    if (studyMinutes !== undefined) user.studyMinutes = studyMinutes;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studyGoals: user.studyGoals,
        quizzesCompleted: user.quizzesCompleted,
        studyStreak: user.studyStreak,
        summariesGenerated: user.summariesGenerated,
        studyMinutes: user.studyMinutes,
        joinedDate: new Date(user.createdAt).toLocaleDateString()
      }
    });
  } catch (error) {
    console.error('Update Stats Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
