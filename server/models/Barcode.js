const mongoose = require('mongoose');


const barcodeSchema = new mongoose.Schema({
  schedule_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: [true, 'معرف الجدول مطلوب'],
  },
  lecture_info: {
    
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
    day_of_week: {
      type: String,
      required: [true, 'يوم الأسبوع مطلوب'],
      enum: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
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
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'القسم مطلوب'],
  },
  department_name: {
    type: String,
    required: true,
  },
  year_level: {
    type: Number,
    required: [true, 'المرحلة مطلوبة'],
    min: 1,
    max: 5,
  },
  barcode: {
    type: String,
    required: [true, 'الباركود مطلوب'],
    unique: true,
  },
  qr_code: {
    type: String, 
  },
  expiry_time: {
    type: Date,
    required: [true, 'وقت انتهاء الباركود مطلوب'],
    
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});


barcodeSchema.index({ schedule_id: 1, 'lecture_info.day_of_week': 1, 'lecture_info.start_time': 1 });
barcodeSchema.index({ expiry_time: 1 }); 

module.exports = mongoose.model('Barcode', barcodeSchema);

