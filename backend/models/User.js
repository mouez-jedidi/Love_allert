const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Basic info
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  height: { type: Number },
  sex: { type: String, enum: ['Homme', 'Femme'], required: true },
  photo: { type: String }, // base64 or URL

  // Auth
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },

  // Location
  country: { type: String, default: 'Tunisie' },
  region: { type: String },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },

  // Personal
  civilStatus: {
    type: String,
    enum: ['Célibataire', 'En couple', 'Marié(e)', 'Divorcé(e)'],
  },
  religion: { type: String },
  languages: [{ type: String }],
  educationLevel: { type: String },

  // Objective
  objective: { type: String },

  // Student
  isStudent: { type: Boolean, default: false },
  studyDomain: { type: String },
  studySpecialty: { type: String },
  university: { type: String },

  // Work
  isWorking: { type: Boolean, default: false },
  workDomain: { type: String },
  workPost: { type: String },

  // Interests
  interests: [{ type: String }],
  bio: { type: String },

  // Matching preferences
  minAge: { type: Number, default: 18 },
  maxAge: { type: Number, default: 35 },
  maxDistance: { type: Number, default: 500 }, // meters

  // App data
  fcmToken: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

// Index for geo queries
UserSchema.index({ location: '2dsphere' });

// Hash password before save
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);