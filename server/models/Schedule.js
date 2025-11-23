const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'معرف القسم مطلوب'],
  },
  department_name: {
    type: String,
    required: [true, 'اسم القسم مطلوب'],
  },
  year_level: {
    type: Number,
    required: [true, 'المرحلة الدراسية مطلوبة'],
    min: 1,
    max: 5,
  },
  academic_year: {
    type: String,
    required: [true, 'السنة الدراسية مطلوبة'],
  },
  semester: {
    type: String,
    required: [true, 'الفصل الدراسي مطلوب'],
    enum: ['الفصل الأول', 'الفصل الثاني', 'صيفي'],
  },
  
  week_schedule: {
    type: [
      {
        day: {
          type: String,
          required: true,
          enum: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
        },
        lectures: [
          {
            course_name: {
              type: String,
              required: [true, 'اسم المادة مطلوب'],
            },
            course_code: {
              type: String,
            },
            instructor_name: {
              type: String,
              required: [true, 'اسم المحاضر مطلوب'],
            },
            room_number: {
              type: String,
              required: [true, 'رقم القاعة مطلوب'],
            },
            start_time: {
              type: String,
              required: [true, 'وقت البدء مطلوب'],
              
            },
            end_time: {
              type: String,
              required: [true, 'وقت الانتهاء مطلوب'],
              
            },
            lecture_type: {
              type: String,
              enum: ['نظري', 'عملي', 'تمارين'],
              default: 'نظري',
            },
          },
        ],
      },
    ],
    required: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});


scheduleSchema.index({ department_id: 1, year_level: 1, academic_year: 1, semester: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);

