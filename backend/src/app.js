const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { corsOrigin } = require("./config/env");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const vehiclesRoutes = require("./routes/vehicles.routes");
const appointmentsRoutes = require("./routes/appointments.routes");
const workOrdersRoutes = require("./routes/workorders.routes");

function createApp() {
  const app = express();

  app.use(morgan("dev"));
  
  // Debug CORS
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
  });

  // Configuration CORS plus robuste
  app.use(cors({ 
    origin: corsOrigin || "https://m1p15-bmean-niaina.vercel.app", 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/vehicles", vehiclesRoutes);
  app.use("/api/appointments", appointmentsRoutes);
  app.use("/api/workorders", workOrdersRoutes);

  app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
  });

  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    res.status(status).json({ message });
  });

  return app;
}

module.exports = { createApp };
