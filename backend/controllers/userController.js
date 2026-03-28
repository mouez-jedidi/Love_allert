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