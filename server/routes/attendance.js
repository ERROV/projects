const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Lecture = require('../models/Lecture');
const Barcode = require('../models/Barcode');
const { protect } = require('../middleware/auth');




router.get('/', protect, async (req, res) => {
  try {
    const { student_id, date, lecture_id } = req.query;
    let query = {};

    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id });
      if (student) {
        query.student_id = student._id;
      }
    } else if (student_id) {
      query.student_id = student_id;
    }

    if (date) {
      query.date = date;
    }

    if (lecture_id) {
      query.lecture_id = lecture_id;
    }

    const attendance = await Attendance.find(query)
      .populate('student_id', 'full_name student_number')
      .populate('lecture_id', 'course_name course_code')
      .sort({ date: -1, check_in_time: -1 });

    res.json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/', protect, async (req, res) => {
  try {
    let student_id = req.body.student_id;
    let barcode_id = null;
    let department_id = null;
    let year_level = null;

    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'بيانات الطالب غير موجودة',
        });
      }
      student_id = student._id;
      department_id = student.department_id;
      year_level = student.year_level;
    }

    
    if (req.body.barcode) {
      const barcodeDoc = await Barcode.findOne({
        barcode: req.body.barcode,
        is_active: true,
      });

      if (!barcodeDoc) {
        return res.status(400).json({
          success: false,
          message: 'الباركود غير صحيح',
        });
      }

      barcode_id = barcodeDoc._id;
      department_id = barcodeDoc.department_id;
      year_level = barcodeDoc.year_level;

      
      if (req.user.role === 'student') {
        const student = await Student.findOne({ user_id: req.user._id });
        if (student) {
          if (student.department_id.toString() !== department_id.toString() ||
              student.year_level !== year_level) {
            return res.status(403).json({
              success: false,
              message: 'الباركود لا يطابق قسمك أو مرحلتك الدراسية',
            });
          }
        }
      }
    }

    
    if (req.body.lecture_id) {
      const lecture = await Lecture.findById(req.body.lecture_id);
      if (lecture) {
        req.body.lecture_name = lecture.course_name;
      }
    }

    const attendance = await Attendance.create({
      ...req.body,
      student_id,
      barcode_id,
      department_id,
      year_level,
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student_id', 'full_name student_number department year_level')
      .populate('lecture_id', 'course_name course_code')
      .populate('barcode_id', 'barcode department_name year_level');

    res.status(201).json({
      success: true,
      data: populatedAttendance,
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'تم تسجيل الحضور لهذا اليوم والمحاضرة مسبقاً',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/barcode', protect, async (req, res) => {
  try {
    const { barcode, lecture_id } = req.body;

    console.log('Barcode attendance request:', { 
      barcode, 
      lecture_id, 
      user_id: req.user._id,
      user_role: req.user.role 
    });

    if (!barcode || !barcode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'الباركود مطلوب',
      });
    }

    
    const student = await Student.findOne({ user_id: req.user._id })
      .populate('department_id', 'name code');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'بيانات الطالب غير موجودة',
      });
    }

    console.log('Student found:', {
      id: student._id,
      name: student.full_name,
      department_id: student.department_id?._id || student.department_id,
      department_name: student.department_id?.name || student.department,
      year_level: student.year_level,
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

    
    let barcodeDoc = await Barcode.findOne({
      barcode: barcode.trim(),
      is_active: true,
    })
      .populate('schedule_id', 'department_name year_level')
      .populate('department_id', 'name code');

    console.log('Barcode document:', barcodeDoc ? {
      id: barcodeDoc._id,
      department_id: barcodeDoc.department_id,
      year_level: barcodeDoc.year_level,
      expiry_time: barcodeDoc.expiry_time,
      lecture_info: barcodeDoc.lecture_info,
    } : 'Not found');

    if (!barcodeDoc) {
      return res.status(400).json({
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
        message: 'انتهت صلاحية الباركود. وقت انتهاء المحاضرة: ' + barcodeDoc.expiry_time.toLocaleString('ar-SA'),
        expiry_time: barcodeDoc.expiry_time,
      });
    }

    
    const studentDeptId = student.department_id?._id?.toString() || 
                          student.department_id?.toString() || 
                          student.department_id;
    const barcodeDeptId = barcodeDoc.department_id?._id?.toString() || 
                          barcodeDoc.department_id?.toString() || 
                          barcodeDoc.department_id;
    
    console.log('Department comparison:', {
      student_dept: studentDeptId,
      barcode_dept: barcodeDeptId,
      student_year: student.year_level,
      barcode_year: barcodeDoc.year_level,
      match: studentDeptId === barcodeDeptId && student.year_level === barcodeDoc.year_level,
    });
    
    if (studentDeptId !== barcodeDeptId || student.year_level !== barcodeDoc.year_level) {
      return res.status(403).json({
        success: false,
        message: `الباركود لا يطابق قسمك أو مرحلتك الدراسية. باركود القسم: ${barcodeDoc.department_name} - المرحلة ${barcodeDoc.year_level}. قسمك: ${student.department_id?.name || student.department} - مرحلتك: ${student.year_level}`,
      });
    }

    
    const lecture_name = barcodeDoc.lecture_info?.course_name || '';
    const lecture_code = barcodeDoc.lecture_info?.course_code || '';

    
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await Attendance.findOne({
      student_id: student._id,
      date: today,
      barcode_id: barcodeDoc._id,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'تم تسجيل الحضور لهذه المحاضرة مسبقاً',
        data: existingAttendance,
      });
    }

    
    const checkInTime = new Date().toTimeString().split(' ')[0];

    const attendance = await Attendance.create({
      student_id: student._id,
      date: today,
      check_in_time: checkInTime,
      barcode: barcode,
      barcode_id: barcodeDoc._id,
      department_id: student.department_id,
      year_level: student.year_level,
      lecture_id: lecture_id || null,
      lecture_name: lecture_name,
      status: 'present',
    });

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('student_id', 'full_name student_number')
      .populate('lecture_id', 'course_name course_code');

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الحضور بنجاح',
      data: populatedAttendance,
    });
  } catch (error) {
    console.error('Barcode attendance error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'تم تسجيل الحضور لهذا اليوم والمحاضرة مسبقاً',
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.put('/:id', protect, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('student_id', 'full_name student_number')
      .populate('lecture_id', 'course_name course_code');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'سجل الحضور غير موجود',
      });
    }

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'سجل الحضور غير موجود',
      });
    }

    res.json({
      success: true,
      message: 'تم حذف سجل الحضور بنجاح',
    });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

