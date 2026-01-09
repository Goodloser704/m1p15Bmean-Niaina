const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    scheduledAt: { type: Date },
    status: {
      type: String,
      required: true,
      enum: ["requested", "confirmed", "in_progress", "done", "canceled"],
      default: "requested"
    },
    clientNote: { type: String, trim: true },
    managerNote: { type: String, trim: true },
    mechanicNote: { type: String, trim: true },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);

