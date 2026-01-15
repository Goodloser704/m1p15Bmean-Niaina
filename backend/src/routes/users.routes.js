const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, requireRole("manager"), async (req, res) => {
  const { role } = req.query || {};
  const filter = {};
  if (role) filter.role = String(role);

  const users = await User.find(filter).sort({ createdAt: -1 });
  return res.json({ users: users.map((u) => u.toSafeJSON()) });
});

// Récupérer les inscriptions en attente
router.get("/pending", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const pendingUsers = await User.find({ 
      status: "pending",
      role: { $in: ["mechanic", "manager"] }
    }).sort({ createdAt: -1 });
    
    return res.json({ users: pendingUsers.map((u) => u.toSafeJSON()) });
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return res.status(500).json({ message: "Failed to fetch pending registrations" });
  }
});

// Approuver ou rejeter une inscription
router.patch("/:userId/status", requireAuth, requireRole("manager"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.status !== "pending") {
      return res.status(400).json({ message: "User is not pending approval" });
    }

    user.status = status;
    await user.save();

    return res.json({ 
      message: `User ${status} successfully`,
      user: user.toSafeJSON() 
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({ message: "Failed to update user status" });
  }
});

module.exports = router;

