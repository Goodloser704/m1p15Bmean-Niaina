const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    plate: { type: String, required: true, trim: true, uppercase: true },
    vin: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);

