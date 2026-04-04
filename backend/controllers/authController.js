const User = require('../models/User');
const { sendOTP, verifyOTP } = require('../config/twilio');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../config/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    console.log('📥 Register body:', req.body);
    const {
  email, password, firstName, lastName,
  age, sex, birthday, zodiac,
  photo, height, region, civilStatus, religion,
  languages, objective, isStudent, isWorking,
  studyDomain, studySpecialty, university,
  educationLevel, workDomain, workPost,
  interests, bio, minAge, maxAge, maxDistance,
  isEmailVerified,
} = req.body;

    console.log('🔍 Checking if email exists...');
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    // Generate verification code
    const code = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('✅ Email is free, creating user...');
const user = await User.create({
  email, password,
  firstName, lastName,
  age, sex, birthday, zodiac,
  photo,
  height: height || null,
  region,
  civilStatus,
  religion,
  languages: languages || [],
  objective,
  isStudent: isStudent || false,
  isWorking: isWorking || false,
  studyDomain,
  studySpecialty,
  university,
  educationLevel,
  workDomain,
  workPost,
  interests: interests || [],
  bio,
  minAge: minAge || 18,
  maxAge: maxAge || 35,
  maxDistance: maxDistance || 500,
  isEmailVerified: isEmailVerified || false,
});

    console.log('✅ User created:', user._id);

    // Send verification email
    await sendVerificationEmail(email, firstName, code);

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sex: user.sex,
        age: user.age,
        isEmailVerified: false,
      },
      message: 'Vérifiez votre email',
    });
  } catch (err) {
    console.log('❌ REGISTER ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    if (user.isEmailVerified) {
      return res.json({ message: 'Email déjà vérifié' });
    }

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Code incorrect' });
    }

    if (new Date() > user.emailVerificationExpiry) {
      return res.status(400).json({ message: 'Code expiré' });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;
    await user.save();

    res.json({ message: 'Email vérifié avec succès ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/resend-code
exports.resendCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const code = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationCode = code;
    user.emailVerificationExpiry = expiry;
    await user.save();

    await sendVerificationEmail(user.email, user.firstName, code);
    res.json({ message: 'Code renvoyé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        sex: user.sex,
        age: user.age,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route POST /api/auth/send-phone-otp
exports.sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Numéro de téléphone requis' });
    }

    const result = await sendOTP(phone);
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }

    // Save phone to user
    await User.findByIdAndUpdate(req.user.id, { phone });

    res.json({ message: 'Code envoyé par SMS' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email non trouvé' });
    }

    const code = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.emailVerificationCode = code;
    user.emailVerificationExpiry = expiry;
    await user.save();

    await sendVerificationEmail(email, user.firstName, code);
    res.json({ message: 'Code envoyé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/verify-reset-code
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email non trouvé' });

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Code incorrect' });
    }
    if (new Date() > user.emailVerificationExpiry) {
      return res.status(400).json({ message: 'Code expiré' });
    }

    res.json({ message: 'Code valide' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email non trouvé' });

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Code incorrect' });
    }
    if (new Date() > user.emailVerificationExpiry) {
      return res.status(400).json({ message: 'Code expiré' });
    }

    user.password = newPassword;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/verify-phone-otp
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;

    const result = await verifyOTP(phone, code);
    if (!result.success) {
      return res.status(400).json({ message: 'Code incorrect ou expiré' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      isPhoneVerified: true,
    });

    res.json({ message: 'Téléphone vérifié ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route POST /api/auth/pre-verify
// Send verification code WITHOUT creating account
exports.preVerify = async (req, res) => {
  try {
    const { email, firstName } = req.body;

    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const code = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // Store code in a temporary collection or cache
    // We'll use a simple in-memory store for now
    global.verificationCodes = global.verificationCodes || {};
    global.verificationCodes[email] = { code, expiry, firstName };

    await sendVerificationEmail(email, firstName, code);
    res.json({ message: 'Code envoyé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/check-pre-verify
exports.checkPreVerify = async (req, res) => {
  try {
    const { email, code } = req.body;

    const stored = global.verificationCodes?.[email];
    if (!stored) {
      return res.status(400).json({ message: 'Code expiré ou invalide' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ message: 'Code incorrect' });
    }

    if (new Date() > stored.expiry) {
      return res.status(400).json({ message: 'Code expiré' });
    }

    // Mark as verified
    global.verificationCodes[email].verified = true;
    res.json({ message: 'Email vérifié ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};