const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ is_active: true })
      .populate('manager_id', 'email role')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: departments,
      count: departments.length,
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager_id', 'email role');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود',
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.post('/', protect, authorize('dean', 'admin'), async (req, res) => {
  try {
    const { name, code, description, tuition_fee, manager_id } = req.body;

    
    const existingDept = await Department.findOne({
      $or: [{ name }, { code: code.toUpperCase() }],
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: 'القسم موجود بالفعل',
      });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      tuition_fee,
      manager_id,
    });

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.put('/:id', protect, authorize('dean', 'admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود',
      });
    }

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.delete('/:id', protect, authorize('dean', 'admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'القسم غير موجود',
      });
    }

    res.json({
      success: true,
      message: 'تم حذف القسم بنجاح',
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

