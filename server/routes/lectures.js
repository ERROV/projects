const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');




router.get('/', async (req, res) => {
  try {
    const { day_of_week, department, department_id, student_id } = req.query;
    let query = {};

    if (day_of_week) {
      query.day_of_week = day_of_week;
    }

    if (department_id) {
      
      const dept = await Department.findById(department_id);
      if (dept) {
        query.department = dept.name;
      }
    } else if (department) {
      query.department = department;
    }

    
    if (student_id) {
      const Student = require('../models/Student');
      const student = await Student.findById(student_id).populate('department_id');
      if (student && student.department_id) {
        query.department = student.department_id.name;
      }
    }

    const lectures = await Lecture.find(query).sort({ start_time: 1 });

    res.json({
      success: true,
      count: lectures.length,
      data: lectures,
    });
  } catch (error) {
    console.error('Get lectures error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.get('/:id', async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'المحاضرة غير موجودة',
      });
    }

    res.json({
      success: true,
      data: lecture,
    });
  } catch (error) {
    console.error('Get lecture error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/', protect, async (req, res) => {
  try {
    const lecture = await Lecture.create(req.body);

    res.status(201).json({
      success: true,
      data: lecture,
    });
  } catch (error) {
    console.error('Create lecture error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.put('/:id', protect, async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'المحاضرة غير موجودة',
      });
    }

    res.json({
      success: true,
      data: lecture,
    });
  } catch (error) {
    console.error('Update lecture error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.delete('/:id', protect, async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndDelete(req.params.id);

    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: 'المحاضرة غير موجودة',
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المحاضرة بنجاح',
    });
  } catch (error) {
    console.error('Delete lecture error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

