const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');




router.get('/', protect, async (req, res) => {
  try {
    let query = { is_active: true };

    
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id });
      if (student) {
        query.department_id = student.department_id;
        query.year_level = student.year_level;
      } else {
        return res.json({
          success: true,
          count: 0,
          data: [],
        });
      }
    } else {
      
      if (req.query.department_id) {
        query.department_id = req.query.department_id;
      }
      if (req.query.year_level) {
        query.year_level = parseInt(req.query.year_level);
      }
    }

    if (req.query.academic_year) {
      query.academic_year = req.query.academic_year;
    }
    if (req.query.semester) {
      query.semester = req.query.semester;
    }

    const schedules = await Schedule.find(query)
      .populate('department_id', 'name code')
      .populate('created_by', 'email role')
      .sort({ academic_year: -1, semester: 1, year_level: 1 });

    res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.get('/student', protect, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const student = await Student.findOne({ user_id: req.user._id }).populate('department_id', 'name code');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'بيانات الطالب غير موجودة',
      });
    }

    
    if (!student.department_id && !student.department) {
      return res.status(400).json({
        success: false,
        message: 'الطالب غير مرتبط بقسم. يرجى التواصل مع الإدارة.',
      });
    }

    
    if (!student.year_level) {
      return res.status(400).json({
        success: false,
        message: 'المرحلة الدراسية غير محددة. يرجى التواصل مع الإدارة.',
      });
    }

    console.log('Student schedule request:', {
      student_id: student._id,
      department_id: student.department_id?._id || student.department_id,
      department_name: student.department_id?.name || student.department,
      year_level: student.year_level,
      hasDepartmentId: !!student.department_id,
      hasYearLevel: !!student.year_level,
    });

    
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    
    let semester = 'الفصل الأول';
    if (currentMonth >= 2 && currentMonth <= 6) {
      semester = 'الفصل الثاني';
    } else if (currentMonth >= 7 && currentMonth <= 8) {
      semester = 'صيفي';
    }

    const academicYear = `${currentYear}-${currentYear + 1}`;

    
    let studentDepartmentId = student.department_id;
    
    
    if (student.department_id && typeof student.department_id === 'object' && student.department_id._id) {
      studentDepartmentId = student.department_id._id;
    } else if (student.department_id && typeof student.department_id === 'object' && student.department_id.toString) {
      
      studentDepartmentId = student.department_id;
    } else if (typeof student.department_id === 'string') {
      
      const mongoose = require('mongoose');
      studentDepartmentId = mongoose.Types.ObjectId.isValid(student.department_id) 
        ? new mongoose.Types.ObjectId(student.department_id)
        : student.department_id;
    }

    console.log('Searching for schedule:', {
      student_department_id: studentDepartmentId,
      student_department_id_type: typeof studentDepartmentId,
      student_department_name: student.department_id?.name || student.department,
      student_year_level: student.year_level,
      student_year_level_type: typeof student.year_level,
      academic_year: academicYear,
      semester: semester,
    });

    
    const allSchedules = await Schedule.find({
      department_id: studentDepartmentId,
      year_level: student.year_level,
      is_active: true,
    })
      .populate('department_id', 'name code')
      .sort({ createdAt: -1 });

    console.log('All available schedules for student:', {
      count: allSchedules.length,
      schedules: allSchedules.map(s => ({
        id: s._id,
        department_id: s.department_id?._id || s.department_id,
        department_name: s.department_name,
        year_level: s.year_level,
        academic_year: s.academic_year,
        semester: s.semester,
        week_schedule_days: s.week_schedule?.length || 0,
      })),
    });

    
    let schedule = allSchedules.find(s => 
      s.academic_year === academicYear && 
      s.semester === semester
    );

    if (schedule) {
      console.log('First search result: Found (by academic year and semester)');
    } else {
      console.log('First search result: Not found (by academic year and semester)');
    }

    
    if (!schedule && allSchedules.length > 0) {
      console.log('Trying fallback search (any active schedule)...');
      schedule = allSchedules[0]; 
      console.log('Fallback search result: Found (latest schedule)');
    } else if (!schedule) {
      console.log('Fallback search result: Not found (no schedules available)');
    }

    if (!schedule) {
      
      const anyScheduleForDept = await Schedule.findOne({
        department_id: studentDepartmentId,
        is_active: true,
      })
        .populate('department_id', 'name code')
        .sort({ createdAt: -1 });

      if (anyScheduleForDept) {
        console.log('Found schedule for department but different year level:', {
          schedule_year_level: anyScheduleForDept.year_level,
          student_year_level: student.year_level,
        });
      }

      return res.json({
        success: true,
        data: null,
        message: `لا يوجد جدول متاح حالياً للقسم "${student.department_id?.name || student.department}" والمرحلة ${student.year_level}. يرجى التواصل مع الإدارة.`,
        debug: {
          student_department_id: studentDepartmentId?.toString(),
          student_year_level: student.year_level,
          available_schedules_count: allSchedules.length,
        },
      });
    }

    
    if (!schedule.week_schedule || !Array.isArray(schedule.week_schedule) || schedule.week_schedule.length === 0) {
      console.log('Schedule found but no week_schedule');
      return res.json({
        success: true,
        data: schedule,
        message: 'الجدول موجود لكن لا توجد محاضرات مضافة',
      });
    }

    
    let totalLectures = 0;
    for (const day of schedule.week_schedule) {
      if (day && day.lectures && Array.isArray(day.lectures)) {
        totalLectures += day.lectures.length;
      }
    }

    console.log('Schedule found with lectures:', {
      schedule_id: schedule._id,
      department: schedule.department_name,
      year_level: schedule.year_level,
      week_schedule_days: schedule.week_schedule.length,
      total_lectures: totalLectures,
      week_schedule_structure: schedule.week_schedule.map((day) => ({
        day: day.day,
        lectures_count: day.lectures ? day.lectures.length : 0,
      })),
    });

    
    
    const schedulePlain = await Schedule.findById(schedule._id)
      .populate('department_id', 'name code')
      .lean(); 
    
    
    const scheduleData = schedulePlain || (schedule.toObject ? schedule.toObject() : JSON.parse(JSON.stringify(schedule)));
    
    
    if (!scheduleData.week_schedule || !Array.isArray(scheduleData.week_schedule)) {
      console.error('week_schedule is missing or not an array after conversion:', {
        hasWeekSchedule: !!scheduleData.week_schedule,
        isArray: Array.isArray(scheduleData.week_schedule),
        scheduleDataKeys: Object.keys(scheduleData),
      });
      return res.json({
        success: true,
        data: scheduleData,
        message: 'الجدول موجود لكن لا توجد محاضرات مضافة',
      });
    }

    
    const daysWithLectures = scheduleData.week_schedule.filter(day => 
      day && day.lectures && Array.isArray(day.lectures) && day.lectures.length > 0
    );

    console.log('Returning schedule data:', {
      schedule_id: scheduleData._id,
      week_schedule_length: scheduleData.week_schedule.length,
      days_with_lectures: daysWithLectures.length,
      total_lectures: totalLectures,
      first_day: scheduleData.week_schedule[0]?.day,
      first_day_lectures_count: scheduleData.week_schedule[0]?.lectures?.length,
      sample_lecture: scheduleData.week_schedule[0]?.lectures?.[0],
    });
    
    res.json({
      success: true,
      data: scheduleData,
    });
  } catch (error) {
    console.error('Get student schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.get('/:id', protect, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('department_id', 'name code')
      .populate('created_by', 'email role');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'الجدول غير موجود',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/', protect, authorize('admin', 'dean', 'department_manager'), async (req, res) => {
  try {
    const {
      department_id,
      year_level,
      academic_year,
      semester,
      week_schedule,
    } = req.body;

    if (!department_id || !year_level || !academic_year || !semester || !week_schedule) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة',
      });
    }

    const Department = require('../models/Department');
    const department = await Department.findById(department_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود',
      });
    }

    
    const existingSchedule = await Schedule.findOne({
      department_id,
      year_level,
      academic_year,
      semester,
      is_active: true,
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: 'يوجد جدول نشط بالفعل لهذا القسم والمرحلة والفصل',
      });
    }

    const schedule = await Schedule.create({
      department_id,
      department_name: department.name,
      year_level,
      academic_year,
      semester,
      week_schedule,
      created_by: req.user._id,
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('department_id', 'name code')
      .populate('created_by', 'email role');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الجدول بنجاح',
      data: populatedSchedule,
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.put('/:id', protect, authorize('admin', 'dean', 'department_manager'), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'الجدول غير موجود',
      });
    }

    const updateData = { ...req.body };

    
    if (updateData.department_id) {
      const Department = require('../models/Department');
      const department = await Department.findById(updateData.department_id);
      if (department) {
        updateData.department_name = department.name;
      }
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('department_id', 'name code')
      .populate('created_by', 'email role');

    res.json({
      success: true,
      message: 'تم تحديث الجدول بنجاح',
      data: updatedSchedule,
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.delete('/:id', protect, authorize('admin', 'dean', 'department_manager'), async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'الجدول غير موجود',
      });
    }

    
    schedule.is_active = false;
    await schedule.save();

    res.json({
      success: true,
      message: 'تم حذف الجدول بنجاح',
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

