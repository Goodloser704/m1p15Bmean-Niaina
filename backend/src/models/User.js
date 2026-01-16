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
    address: { type: String, trim: true },
    // Informations spécifiques aux mécaniciens (configurées par le manager)
    contractType: { 
      type: String, 
      enum: ["monthly", "daily", "commission"]
    },
    baseSalary: { 
      type: Number, 
      default: 0
    },
    commissionRate: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    bankDetails: {
      iban: { type: String, trim: true },
      bic: { type: String, trim: true },
      bankName: { type: String, trim: true }
    }
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const base = {
    id: String(this._id),
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    status: this.status,
    phone: this.phone,
    address: this.address,
    createdAt: this.createdAt
  };

  // Ajouter les informations de contrat pour les mécaniciens
  if (this.role === 'mechanic') {
    base.contractType = this.contractType;
    base.baseSalary = this.baseSalary;
    base.commissionRate = this.commissionRate;
    base.bankDetails = this.bankDetails;
  }

  return base;
};

module.exports = mongoose.model("User", userSchema);

