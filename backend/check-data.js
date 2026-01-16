const mongoose = require('mongoose');
const User = require('./src/models/User');
const Appointment = require('./src/models/Appointment');
const WorkOrder = require('./src/models/WorkOrder');
require('dotenv').config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔍 Vérification des données...\n');
    
    const mechanic = await User.findOne({ email: 'mechanic@demo.com' });
    console.log('👤 Mécanicien:', {
      id: mechanic?._id.toString(),
      name: mechanic?.fullName,
      commissionRate: mechanic?.commissionRate
    });
    
    const appointments = await Appointment.find({ mechanicId: mechanic?._id });
    console.log('\n📅 Rendez-vous assignés au mécanicien:', appointments.length);
    appointments.forEach(apt => {
      console.log(`   - ${apt._id} | Status: ${apt.status} | MechanicId: ${apt.mechanicId}`);
    });
    
    const workOrders = await WorkOrder.find({});
    console.log('\n📋 Work Orders (tous):', workOrders.length);
    workOrders.forEach(wo => {
      console.log(`   - ${wo._id} | Status: ${wo.status} | AppointmentId: ${wo.appointmentId} | Total: ${wo.total}€`);
    });
    
    const paidWorkOrders = await WorkOrder.find({ status: 'paid' });
    console.log('\n💰 Work Orders payés:', paidWorkOrders.length);
    
    for (const wo of paidWorkOrders) {
      const apt = await Appointment.findById(wo.appointmentId);
      console.log(`   - WO ${wo._id.toString().substring(0, 8)}... | Total: ${wo.total}€ | Appointment MechanicId: ${apt?.mechanicId}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();
