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

module.exports = router;

