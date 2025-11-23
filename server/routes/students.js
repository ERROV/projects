const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');




router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const { department, department_id, year_level, search } = req.query;
    let query = {};

    if (department_id) {
      query.department_id = department_id;
    } else if (department) {
      query.department = department;
    }

    if (year_level) {
      query.year_level = parseInt(year_level);
    }

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { student_number: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('department_id', 'name code')
      .sort({ full_name: 1 });

    res.json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.get('/me', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'بيانات الطالب غير موجودة',
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'الطالب غير موجود',
      });
    }

    
    if (req.user.role === 'student') {
      const currentStudent = await Student.findOne({ user_id: req.user._id });
      if (currentStudent && student._id.toString() !== currentStudent._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول لهذه البيانات',
        });
      }
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.put('/me', protect, upload.single('avatar'), async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'بيانات الطالب غير موجودة',
      });
    }

    let updateData = req.body;

    if (req.file) {
      updateData.avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      student._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedStudent,
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.put('/:id', protect, upload.single('avatar'), async (req, res) => {
  try {
    
    if (!['admin', 'dean', 'department_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'الطالب غير موجود',
      });
    }

    let updateData = { ...req.body };

    
    if (updateData.department_id) {
      const Department = require('../models/Department');
      const department = await Department.findById(updateData.department_id);
      if (department) {
        updateData.department = department.name;
      }
    }

    if (req.file) {
      updateData.avatar_url = `/uploads/avatars/${req.file.filename}`;
    }

    
    if (updateData.year_level) {
      updateData.year_level = parseInt(updateData.year_level);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('department_id', 'name code');

    res.json({
      success: true,
      data: updatedStudent,
      message: 'تم تحديث بيانات الطالب بنجاح',
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/update-departments', protect, async (req, res) => {
  try {
    if (!['admin', 'dean'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const Department = require('../models/Department');
    const students = await Student.find({ $or: [
      { department_id: { $exists: false } },
      { department_id: null },
    ]});

    let updated = 0;
    let errors = [];

    for (const student of students) {
      try {
        
        if (student.department) {
          const department = await Department.findOne({ 
            name: student.department 
          });

          if (department) {
            await Student.findByIdAndUpdate(student._id, {
              department_id: department._id,
            });
            updated++;
          } else {
            errors.push(`لم يتم العثور على قسم: ${student.department} للطالب ${student.full_name}`);
          }
        }
      } catch (error) {
        errors.push(`خطأ في تحديث الطالب ${student.full_name}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `تم تحديث ${updated} طالب`,
      updated,
      total: students.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Update departments error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

