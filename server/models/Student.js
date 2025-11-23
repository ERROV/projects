const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  full_name: {
    type: String,
    required: [true, 'الاسم الكامل مطلوب'],
  },
  student_number: {
    type: String,
    required: [true, 'رقم الطالب مطلوب'],
    unique: true,
  },
  phone: {
    type: String,
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'القسم مطلوب'],
  },
  department: {
    type: String,
    required: [true, 'اسم القسم مطلوب'],
  },
  year_level: {
    type: Number,
    required: [true, 'المرحلة الدراسية مطلوبة'],
    min: 1,
    max: 5,
  },
  avatar_url: {
    type: String,
  },
  face_encoding: {
    type: String, 
  },
  biometric_enabled: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Student', studentSchema);

