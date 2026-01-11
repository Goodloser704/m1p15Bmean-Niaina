const mongoose = require("mongoose");

const workOrderTaskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const workOrderMessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true, enum: ["client", "manager", "mechanic"] },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const workOrderSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { 
      type: String, 
      required: true, 
      enum: ["draft", "estimated", "pending_client_approval", "approved", "rejected", "validated", "paid"], 
      default: "draft" 
    },
    tasks: { type: [workOrderTaskSchema], default: [] },
    estimationNote: { type: String, trim: true },
    clientApproved: { type: Boolean },
    clientNote: { type: String, trim: true },
    messages: { type: [workOrderMessageSchema], default: [] }
  },
  { timestamps: true }
);

workOrderSchema.virtual("total").get(function total() {
  return (this.tasks || []).reduce((sum, t) => sum + Number(t.price || 0), 0);
});

module.exports = mongoose.model("WorkOrder", workOrderSchema);

