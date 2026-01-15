const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["client", "mechanic", "manager"] },
    status: { 
      type: String, 
      required: true, 
      enum: ["pending", "approved", "rejected"], 
      default: "approved" 
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: String(this._id),
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    status: this.status,
    phone: this.phone,
    address: this.address,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("User", userSchema);

