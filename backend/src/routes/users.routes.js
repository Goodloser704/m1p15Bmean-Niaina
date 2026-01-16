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
    const { status, contractType, baseSalary, commissionRate, bankDetails } = req.body || {};

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

    // Si on approuve un mécanicien, les infos de contrat sont obligatoires
    if (status === "approved" && user.role === "mechanic") {
      if (!contractType || !["monthly", "daily", "commission"].includes(contractType)) {
        return res.status(400).json({ message: "Valid contract type is required for mechanic approval (monthly, daily, or commission)" });
      }

      if (contractType !== "commission" && (!baseSalary || baseSalary <= 0)) {
        return res.status(400).json({ message: "Base salary is required for monthly and daily contracts" });
      }

      if (contractType === "commission" && (!commissionRate || commissionRate <= 0)) {
        return res.status(400).json({ message: "Commission rate is required for commission-based contracts" });
      }

      // Configurer le contrat
      user.contractType = contractType;
      user.baseSalary = contractType !== "commission" ? Number(baseSalary) : 0;
      user.commissionRate = Number(commissionRate) || 0;

      if (bankDetails) {
        user.bankDetails = {
          iban: bankDetails.iban ? String(bankDetails.iban).trim() : undefined,
          bic: bankDetails.bic ? String(bankDetails.bic).trim() : undefined,
          bankName: bankDetails.bankName ? String(bankDetails.bankName).trim() : undefined
        };
      }
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

