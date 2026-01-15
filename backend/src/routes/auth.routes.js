const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signAccessToken } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  // Vérifier le statut de l'utilisateur
  if (user.status === "pending") {
    return res.status(403).json({ message: "Your account is pending approval" });
  }
  if (user.status === "rejected") {
    return res.status(403).json({ message: "Your account has been rejected" });
  }

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signAccessToken(user);
  return res.json({ token, user: user.toSafeJSON() });
});

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role, phone, address } = req.body || {};
    
    // Validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "Full name, email, password, and role are required" });
    }

    if (!["client", "mechanic", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(String(password), 10);

    // Déterminer le statut selon le rôle
    let status = "approved"; // Par défaut pour les clients
    if (role === "mechanic" || role === "manager") {
      status = "pending"; // Nécessite validation pour mécanicien/manager
    }

    // Créer l'utilisateur
    const user = new User({
      fullName: String(fullName).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role,
      status,
      phone: phone ? String(phone).trim() : undefined,
      address: address ? String(address).trim() : undefined
    });

    await user.save();

    // Si c'est un client, connexion automatique
    if (role === "client") {
      const token = signAccessToken(user);
      return res.status(201).json({ 
        token, 
        user: user.toSafeJSON(),
        message: "Registration successful" 
      });
    }

    // Pour mécanicien/manager, pas de token (en attente de validation)
    return res.status(201).json({ 
      message: "Registration submitted. Waiting for manager approval.",
      user: user.toSafeJSON()
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user.toSafeJSON() });
});

module.exports = router;

