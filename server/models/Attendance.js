const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  date: {
    type: String,
    required: [true, 'التاريخ مطلوب'],
  },
  check_in_time: {
    type: String,
  },
  check_out_time: {
    type: String,
  },
  nfc_card_id: {
    type: String,
  },
  barcode: {
    type: String,
    
  },
  barcode_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barcode',
    
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  year_level: {
    type: Number,
    
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present',
  },
  lecture_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
  },
  lecture_name: {
    type: String,
  },
}, {
  timestamps: true,
});


attendanceSchema.index({ student_id: 1, date: 1, lecture_id: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

