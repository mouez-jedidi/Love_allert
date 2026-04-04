const User = require('../models/User');

// @route PUT /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
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

// @route PUT /api/users/location
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

    res.json({ message: 'Position mise à jour' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/users/nearby
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
// @route DELETE /api/users/account
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Compte supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/users/report
exports.reportUser = async (req, res) => {
  try {
    const { reportedUserId, matchId, reason, details } = req.body;
    console.log(`🚨 Report: ${req.user.id} reported ${reportedUserId} for: ${reason}`);
    // In production, save to a Reports collection
    res.json({ message: 'Signalement envoyé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route POST /api/users/block/:id
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
// @route POST /api/users/gallery
exports.addToGallery = async (req, res) => {
  try {
    const { photoUrl } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      $push: { gallery: photoUrl },
    });
    res.json({ message: 'Photo ajoutée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/users/gallery/:photoUrl
exports.removeFromGallery = async (req, res) => {
  try {
    const photoUrl = decodeURIComponent(req.params.photoUrl);
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { gallery: photoUrl },
    });
    res.json({ message: 'Photo supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route GET /api/users/:id/gallery
exports.getUserGallery = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('gallery');
    res.json({ gallery: user?.gallery || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route GET /api/users/blocked
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers', '_id');
    res.json(user.blockedUsers || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/users/unblock/:id
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