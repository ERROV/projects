const mongoose = require('mongoose');


const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم القسم مطلوب'],
    unique: true,
  },
  code: {
    type: String,
    required: [true, 'رمز القسم مطلوب'],
    unique: true,
    uppercase: true,
  },
  description: {
    type: String,
  },
  tuition_fee: {
    type: Number,
    required: [true, 'رسوم القسم مطلوبة'],
    min: 0,
  },
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    
  },
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Department', departmentSchema);

