const express = require('express');
const router = express.Router();
const Barcode = require('../models/Barcode');
const Department = require('../models/Department');
const Schedule = require('../models/Schedule');
const { protect, authorize } = require('../middleware/auth');
const QRCode = require('qrcode');


router.get('/', protect, async (req, res) => {
  try {
    const { department_id, year_level, schedule_id } = req.query;
    const query = { is_active: true };
    
    if (department_id) query.department_id = department_id;
    if (year_level) query.year_level = parseInt(year_level);
    if (schedule_id) query.schedule_id = schedule_id;

    const barcodes = await Barcode.find(query)
      .populate('schedule_id', 'department_name year_level academic_year semester')
      .populate('department_id', 'name code')
      .populate('created_by', 'email role')
      .sort({ 'lecture_info.day_of_week': 1, 'lecture_info.start_time': 1 });

    res.json({
      success: true,
      data: barcodes,
      count: barcodes.length,
    });
  } catch (error) {
    console.error('Get barcodes error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.get('/:id', protect, async (req, res) => {
  try {
    const barcode = await Barcode.findById(req.params.id)
      .populate('department_id', 'name code')
      .populate('created_by', 'email role');

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: 'الباركود غير موجود',
      });
    }

    res.json({
      success: true,
      data: barcode,
    });
  } catch (error) {
    console.error('Get barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.post('/', protect, authorize('dean', 'admin', 'department_manager'), async (req, res) => {
  try {
    const { schedule_id, day_of_week, lecture_index } = req.body;

    
    const schedule = await Schedule.findById(schedule_id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'الجدول غير موجود',
      });
    }

    
    const daySchedule = schedule.week_schedule.find(d => d.day === day_of_week);
    if (!daySchedule) {
      return res.status(404).json({
        success: false,
        message: 'اليوم غير موجود في الجدول',
      });
    }

    
    const lecture = daySchedule.lectures[lecture_index];
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'المحاضرة غير موجودة',
      });
    }

    
    const existingBarcode = await Barcode.findOne({
      schedule_id,
      'lecture_info.day_of_week': day_of_week,
      'lecture_info.start_time': lecture.start_time,
      is_active: true,
    });

    if (existingBarcode) {
      return res.status(400).json({
        success: false,
        message: 'يوجد باركود لهذه المحاضرة بالفعل',
        data: existingBarcode,
      });
    }

    
    const today = new Date();
    const [hours, minutes] = lecture.end_time.split(':');
    const expiryDate = new Date(today);
    expiryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    
    if (expiryDate < today) {
      expiryDate.setDate(expiryDate.getDate() + 1);
    }

    
    const barcodeValue = `${schedule.department_name}-${schedule.year_level}-${lecture.course_code}-${day_of_week}-${lecture.start_time}-${Date.now()}`;

    
    let qrCodeBase64 = '';
    try {
      qrCodeBase64 = await QRCode.toDataURL(barcodeValue);
    } catch (qrError) {
      console.error('QR Code generation error:', qrError);
    }

    const barcode = await Barcode.create({
      schedule_id,
      lecture_info: {
        course_name: lecture.course_name,
        course_code: lecture.course_code,
        instructor_name: lecture.instructor_name,
        room_number: lecture.room_number,
        day_of_week: day_of_week,
        start_time: lecture.start_time,
        end_time: lecture.end_time,
        lecture_type: lecture.lecture_type || 'نظري',
      },
      department_id: schedule.department_id,
      department_name: schedule.department_name,
      year_level: schedule.year_level,
      barcode: barcodeValue,
      qr_code: qrCodeBase64,
      expiry_time: expiryDate,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: barcode,
    });
  } catch (error) {
    console.error('Create barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.post('/generate-for-schedule', protect, authorize('dean', 'admin', 'department_manager'), async (req, res) => {
  try {
    const { schedule_id } = req.body;

    
    const schedule = await Schedule.findById(schedule_id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'الجدول غير موجود',
      });
    }

    
    if (!schedule.week_schedule || !Array.isArray(schedule.week_schedule) || schedule.week_schedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'الجدول لا يحتوي على محاضرات',
      });
    }

    console.log('Generating barcodes for schedule:', {
      schedule_id: schedule._id,
      department: schedule.department_name,
      year_level: schedule.year_level,
      week_schedule_days: schedule.week_schedule.length,
    });

    const createdBarcodes = [];
    const errors = [];
    let totalLectures = 0;

    
    for (const daySchedule of schedule.week_schedule) {
      if (!daySchedule || !daySchedule.lectures || !Array.isArray(daySchedule.lectures)) {
        console.log(`Skipping day ${daySchedule?.day || 'unknown'}: no lectures array`);
        continue;
      }

      console.log(`Processing day ${daySchedule.day}: ${daySchedule.lectures.length} lectures`);
      totalLectures += daySchedule.lectures.length;

      for (let i = 0; i < daySchedule.lectures.length; i++) {
        const lecture = daySchedule.lectures[i];

        
        if (!lecture || !lecture.course_name || !lecture.start_time || !lecture.end_time) {
          errors.push({
            day: daySchedule.day || 'غير محدد',
            lecture: lecture?.course_name || 'محاضرة غير مكتملة',
            message: 'بيانات المحاضرة غير مكتملة',
          });
          continue;
        }

        try {
          
          const existingBarcode = await Barcode.findOne({
            schedule_id,
            'lecture_info.day_of_week': daySchedule.day,
            'lecture_info.start_time': lecture.start_time,
            is_active: true,
          });

          if (existingBarcode) {
            
            await Barcode.findByIdAndUpdate(existingBarcode._id, { is_active: false });
            console.log(`Deleted old barcode for ${lecture.course_name} on ${daySchedule.day}`);
          }

          
          const today = new Date();
          const [hours, minutes] = lecture.end_time.split(':');
          const expiryDate = new Date(today);
          expiryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          if (expiryDate < today) {
            expiryDate.setDate(expiryDate.getDate() + 1);
          }

          
          const barcodeValue = `${schedule.department_name}-${schedule.year_level}-${lecture.course_code || 'LEC'}-${daySchedule.day}-${lecture.start_time}-${Date.now()}-${i}`;

          
          let qrCodeBase64 = '';
          try {
            qrCodeBase64 = await QRCode.toDataURL(barcodeValue);
          } catch (qrError) {
            console.error('QR Code generation error:', qrError);
          }

          console.log(`Creating barcode for: ${lecture.course_name} on ${daySchedule.day} at ${lecture.start_time}`);

          const barcode = await Barcode.create({
            schedule_id,
            lecture_info: {
              course_name: lecture.course_name,
              course_code: lecture.course_code,
              instructor_name: lecture.instructor_name,
              room_number: lecture.room_number,
              day_of_week: daySchedule.day,
              start_time: lecture.start_time,
              end_time: lecture.end_time,
              lecture_type: lecture.lecture_type || 'نظري',
            },
            department_id: schedule.department_id,
            department_name: schedule.department_name,
            year_level: schedule.year_level,
            barcode: barcodeValue,
            qr_code: qrCodeBase64,
            expiry_time: expiryDate,
            created_by: req.user.id,
          });

          console.log(`Successfully created barcode: ${barcode._id}`);
          createdBarcodes.push(barcode);
        } catch (error) {
          console.error(`Error creating barcode for ${lecture.course_name}:`, error);
          errors.push({
            day: daySchedule.day,
            lecture: lecture.course_name,
            message: error.message,
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `تم إنشاء ${createdBarcodes.length} باركود من أصل ${totalLectures} محاضرة`,
      data: createdBarcodes,
      total_lectures: totalLectures,
      created_count: createdBarcodes.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Generate barcodes error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


const getTodayInArabic = () => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = new Date().getDay();
  return days[today];
};


const calculateExpiryTime = (dayOfWeek, endTime) => {
  const today = new Date();
  const [hours, minutes] = endTime.split(':');
  const expiryDate = new Date(today);
  expiryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  
  if (expiryDate < today) {
    expiryDate.setDate(expiryDate.getDate() + 1);
  }
  
  return expiryDate;
};


const renewBarcodeIfNeeded = async (barcodeDoc) => {
  const today = new Date();
  const todayArabic = getTodayInArabic();
  const lectureDay = barcodeDoc.lecture_info.day_of_week;
  
  
  if (todayArabic === lectureDay) {
    
    const expiryTime = calculateExpiryTime(lectureDay, barcodeDoc.lecture_info.end_time);
    
    
    if (barcodeDoc.expiry_time < today || (barcodeDoc.expiry_time - today) < 3600000) {
      
      barcodeDoc.expiry_time = expiryTime;
      await barcodeDoc.save();
      
      return true; 
    }
  }
  
  return false; 
};


router.post('/scan', protect, async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'الباركود مطلوب',
      });
    }

    
    let barcodeDoc = await Barcode.findOne({
      barcode,
      is_active: true,
    })
      .populate('schedule_id', 'department_name year_level')
      .populate('department_id', 'name code');

    if (!barcodeDoc) {
      return res.status(404).json({
        success: false,
        message: 'الباركود غير صحيح أو غير نشط',
      });
    }

    
    const wasRenewed = await renewBarcodeIfNeeded(barcodeDoc);
    
    
    if (wasRenewed) {
      barcodeDoc = await Barcode.findById(barcodeDoc._id)
        .populate('schedule_id', 'department_name year_level')
        .populate('department_id', 'name code');
    }

    
    const now = new Date();
    if (barcodeDoc.expiry_time < now) {
      return res.status(400).json({
        success: false,
        message: 'انتهت صلاحية الباركود',
        expiry_time: barcodeDoc.expiry_time,
      });
    }

    res.json({
      success: true,
      data: {
        barcode_id: barcodeDoc._id,
        schedule_id: barcodeDoc.schedule_id?._id || barcodeDoc.schedule_id,
        lecture_info: barcodeDoc.lecture_info,
        department_id: barcodeDoc.department_id?._id || barcodeDoc.department_id,
        department_name: barcodeDoc.department_name,
        year_level: barcodeDoc.year_level,
        expiry_time: barcodeDoc.expiry_time,
        renewed: wasRenewed,
      },
    });
  } catch (error) {
    console.error('Scan barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.post('/renew-daily', async (req, res) => {
  try {
    const today = new Date();
    const todayArabic = getTodayInArabic();
    
    
    const barcodes = await Barcode.find({
      is_active: true,
      'lecture_info.day_of_week': todayArabic,
    });

    let renewedCount = 0;
    let errors = [];

    for (const barcode of barcodes) {
      try {
        const expiryTime = calculateExpiryTime(todayArabic, barcode.lecture_info.end_time);
        
        
        if (barcode.expiry_time < today || (barcode.expiry_time - today) < 3600000) {
          barcode.expiry_time = expiryTime;
          await barcode.save();
          renewedCount++;
        }
      } catch (error) {
        errors.push({
          barcode_id: barcode._id,
          error: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `تم تجديد ${renewedCount} باركود`,
      renewed_count: renewedCount,
      total_checked: barcodes.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Renew barcodes error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.put('/:id', protect, authorize('dean', 'admin', 'department_manager'), async (req, res) => {
  try {
    const barcode = await Barcode.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: 'الباركود غير موجود',
      });
    }

    res.json({
      success: true,
      data: barcode,
    });
  } catch (error) {
    console.error('Update barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.delete('/:id', protect, authorize('dean', 'admin', 'department_manager'), async (req, res) => {
  try {
    const barcode = await Barcode.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );

    if (!barcode) {
      return res.status(404).json({
        success: false,
        message: 'الباركود غير موجود',
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الباركود بنجاح',
    });
  } catch (error) {
    console.error('Delete barcode error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

