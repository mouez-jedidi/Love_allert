const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   PUT /api/users/profile
// @desc    Mettre à jour les informations du profil
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    // Sécurité : on empêche la modification directe de l'email et du mot de passe ici
    delete updates.password;
    delete updates.email;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   PUT /api/users/location
// @desc    Mettre à jour la position GPS
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      lastSeen: Date.now(),
    });

    res.json({ message: 'Position mise à jour avec succès' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/users/nearby
// @desc    Trouver des utilisateurs à proximité selon les préférences
exports.getNearbyUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const maxDistance = user.maxDistance || 500;

    const nearbyUsers = await User.find({
      _id: { $ne: req.user.id },
      sex: user.sex === 'Homme' ? 'Femme' : 'Homme',
      age: { $gte: user.minAge, $lte: user.maxAge },
      isActive: true,
      blockedUsers: { $ne: req.user.id },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates,
          },
          $maxDistance: maxDistance,
        },
      },
    }).select('-password -email');

    res.json(nearbyUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/users/:id
// @desc    Récupérer un utilisateur par son ID (avec filtrage de confidentialité)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -emailVerificationCode -emailVerificationExpiry');
    
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    
    const { filterUserByPrivacy } = require('../middleware/privacy');
    const filtered = await filterUserByPrivacy(user, req.user.id);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   PUT /api/users/update-fcm-token
// @desc    Sauvegarder le token de notification Expo/FCM
exports.updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    console.log('📲 Token reçu:', fcmToken); 
    if (!fcmToken) {
      return res.status(400).json({ message: 'Token requis' });
    }
    
    await User.findByIdAndUpdate(req.user.id, { fcmToken });
    console.log(`✅ FCM token mis à jour pour : ${req.user.id}`);
    
    res.json({ message: 'Token de notification mis à jour' });
  } catch (err) {
    console.error('❌ Erreur update FCM token:', err.message);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du token' });
  }
};

// @route   POST /api/users/block/:id
exports.blockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: req.params.id },
    });
    res.json({ message: 'Utilisateur bloqué' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   POST /api/users/unblock/:id
exports.unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blockedUsers: req.params.id },
    });
    res.json({ message: 'Utilisateur débloqué' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/users/blocked
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', 'firstName lastName photo');
    res.json(user.blockedUsers || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   POST /api/users/gallery
exports.addToGallery = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      $push: { gallery: photoUrl },
    });
    res.json({ message: 'Photo ajoutée à la galerie' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   DELETE /api/users/gallery/:photoUrl
exports.removeFromGallery = async (req, res) => {
  try {
    const photoUrl = decodeURIComponent(req.params.photoUrl);
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { gallery: photoUrl },
    });
    res.json({ message: 'Photo supprimée de la galerie' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   GET /api/users/:id/gallery
exports.getUserGallery = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('gallery');
    res.json({ gallery: user?.gallery || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   POST /api/users/report
exports.reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    console.log(`🚨 Signalement : ${req.user.id} a signalé ${reportedUserId} pour : ${reason}`);
    // Ici, tu pourrais créer une entrée dans une collection "Reports"
    res.json({ message: 'Signalement enregistré' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route   DELETE /api/users/account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Compte supprimé définitivement' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};