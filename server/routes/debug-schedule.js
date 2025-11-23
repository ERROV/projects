const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const Department = require('../models/Department');
const { protect } = require('../middleware/auth');


router.get('/debug', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id }).populate('department_id', 'name code');
    
    if (!student) {
      return res.json({
        success: false,
        message: 'الطالب غير موجود',
      });
    }

    
    const allSchedules = await Schedule.find({ is_active: true })
      .populate('department_id', 'name code')
      .sort({ createdAt: -1 });

    
    const allDepartments = await Department.find({ is_active: true });

    
    let studentDepartmentId = student.department_id;
    if (student.department_id && typeof student.department_id === 'object' && student.department_id._id) {
      studentDepartmentId = student.department_id._id;
    }

    const studentSchedules = await Schedule.find({
      department_id: studentDepartmentId,
      year_level: student.year_level,
      is_active: true,
    })
      .populate('department_id', 'name code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.full_name,
        department_id: studentDepartmentId?.toString(),
        department_name: student.department_id?.name || student.department,
        year_level: student.year_level,
      },
      all_departments: allDepartments.map(d => ({
        id: d._id.toString(),
        name: d.name,
        code: d.code,
      })),
      all_schedules_count: allSchedules.length,
      student_schedules_count: studentSchedules.length,
      student_schedules: studentSchedules.map(s => ({
        id: s._id.toString(),
        department_id: s.department_id?._id?.toString() || s.department_id?.toString(),
        department_name: s.department_name,
        year_level: s.year_level,
        academic_year: s.academic_year,
        semester: s.semester,
        week_schedule_days: s.week_schedule?.length || 0,
        total_lectures: s.week_schedule?.reduce((sum, day) => sum + (day.lectures?.length || 0), 0) || 0,
      })),
      all_schedules_sample: allSchedules.slice(0, 5).map(s => ({
        id: s._id.toString(),
        department_id: s.department_id?._id?.toString() || s.department_id?.toString(),
        department_name: s.department_name,
        year_level: s.year_level,
      })),
    });
  } catch (error) {
    console.error('Debug schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;









