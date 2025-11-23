const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  course_code: {
    type: String,
    required: [true, 'رمز المادة مطلوب'],
  },
  course_name: {
    type: String,
    required: [true, 'اسم المادة مطلوب'],
  },
  instructor_name: {
    type: String,
    required: [true, 'اسم المحاضر مطلوب'],
  },
  room_number: {
    type: String,
    required: [true, 'رقم القاعة مطلوب'],
  },
  day_of_week: {
    type: String,
    required: [true, 'يوم الأسبوع مطلوب'],
    enum: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  },
  start_time: {
    type: String,
    required: [true, 'وقت البدء مطلوب'],
  },
  end_time: {
    type: String,
    required: [true, 'وقت الانتهاء مطلوب'],
  },
  credits: {
    type: Number,
    default: 3,
  },
  department: {
    type: String,
    required: [true, 'القسم مطلوب'],
  },
  semester: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Lecture', lectureSchema);

