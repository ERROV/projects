const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Department = require('../models/Department');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');
const { t } = require('../utils/i18n');
const upload = require('../middleware/upload');

// @route   POST /api/auth/register
// @desc    تسجيل مستخدم جديد
// @access  Public
router.post('/register', [
  body('email').isEmail().withMessage((value, { req }) => t(req, 'auth.emailInvalid')),
  body('password').isLength({ min: 6 }).withMessage((value, { req }) => t(req, 'auth.passwordMinLength')),
  body('full_name').notEmpty().withMessage((value, { req }) => t(req, 'auth.fullNameRequired')),
  body('student_number').notEmpty().withMessage((value, { req }) => t(req, 'auth.studentNumberRequired')),
  body('department').optional().notEmpty().withMessage((value, { req }) => t(req, 'auth.departmentRequired')),
  body('department_id').optional().notEmpty().withMessage((value, { req }) => t(req, 'auth.departmentRequired')),
  body('year_level').isInt({ min: 1, max: 5 }).withMessage((value, { req }) => t(req, 'auth.yearLevelInvalid')),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password, full_name, student_number, phone, department, year_level, department_id } = req.body;

    // التحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: t(req, 'auth.emailExists'),
      });
    }

    // التحقق من وجود رقم الطالب
    const studentExists = await Student.findOne({ student_number });
    if (studentExists) {
      return res.status(400).json({
        success: false,
        message: t(req, 'auth.studentNumberExists'),
      });
    }

    // التحقق من وجود قسم (إما department_id أو department)
    if (!department_id && !department) {
      return res.status(400).json({
        success: false,
        message: t(req, 'auth.departmentNotSelected'),
      });
    }

    // البحث عن القسم - إما باستخدام department_id أو department name
    let departmentDoc = null;
    if (department_id) {
      // إذا تم إرسال department_id، البحث باستخدامه
      try {
        departmentDoc = await Department.findById(department_id);
        if (!departmentDoc) {
          return res.status(400).json({
            success: false,
            message: t(req, 'auth.departmentNotFound'),
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: t(req, 'auth.departmentNotFound'),
        });
      }
    } else if (department) {
      // إذا تم إرسال اسم القسم فقط، البحث باستخدام الاسم (case-insensitive)
      departmentDoc = await Department.findOne({ 
        name: { $regex: new RegExp(`^${department}$`, 'i') } 
      });
      
      // إذا لم يوجد القسم، إرجاع خطأ
      if (!departmentDoc) {
        return res.status(400).json({
          success: false,
          message: t(req, 'auth.departmentNotFound'),
        });
      }
    }

    // إنشاء المستخدم
    const user = await User.create({
      email,
      password,
      role: 'student',
    });

    // إنشاء بيانات الطالب
    const student = await Student.create({
      user_id: user._id,
      email,
      full_name,
      student_number,
      phone,
      department_id: departmentDoc._id,
      department: departmentDoc.name,
      year_level,
    });

    // إرجاع البيانات مع التوكن
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      student: {
        id: student._id,
        full_name: student.full_name,
        student_number: student.student_number,
        department: student.department,
        year_level: student.year_level,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    تسجيل الدخول
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage((value, { req }) => t(req, 'auth.emailInvalid')),
  body('password').notEmpty().withMessage((value, { req }) => t(req, 'auth.passwordRequired')),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: t(req, 'auth.invalidCredentials'),
      });
    }

    // التحقق من كلمة المرور
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: t(req, 'auth.invalidCredentials'),
      });
    }

    // الحصول على بيانات الطالب
    const student = await Student.findOne({ user_id: user._id });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      student: student ? {
        id: student._id,
        full_name: student.full_name,
        student_number: student.student_number,
        department: student.department,
        year_level: student.year_level,
      } : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    الحصول على بيانات المستخدم الحالي
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    // إرجاع بيانات المستخدم مع بيانات الطالب إن وجدت
    const userData = {
      id: req.user._id,
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      full_name: req.user.full_name || req.user.name || null,
      name: req.user.full_name || req.user.name || null,
      phone: req.user.phone || null,
      avatar: req.user.avatar || req.user.avatar_url || null,
      avatar_url: req.user.avatar_url || req.user.avatar || null,
      address: req.user.address || null,
      governorate: req.user.governorate || null,
      city: req.user.city || null,
      postal_code: req.user.postal_code || null,
      bio: req.user.bio || req.user.description || null,
      description: req.user.description || req.user.bio || null,
      facebook: req.user.facebook || null,
      twitter: req.user.twitter || null,
      linkedin: req.user.linkedin || null,
      instagram: req.user.instagram || null,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    };

    // إذا كان طالب، أضف بيانات الطالب
    if (student) {
      userData.full_name = student.full_name || userData.full_name;
      userData.name = student.full_name || userData.name;
      userData.student_number = student.student_number;
      userData.department = student.department;
      userData.year_level = student.year_level;
      userData.phone = student.phone || userData.phone;
      userData.avatar_url = student.avatar_url || userData.avatar_url;
      userData.avatar = student.avatar_url || userData.avatar;
      userData.address = student.address || userData.address;
      userData.governorate = student.governorate || userData.governorate;
      userData.city = student.city || userData.city;
    }
    
    res.json({
      success: true,
      data: userData,
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
      },
      student: student ? {
        id: student._id,
        full_name: student.full_name,
        student_number: student.student_number,
        department: student.department,
        year_level: student.year_level,
        phone: student.phone,
        avatar_url: student.avatar_url,
      } : null,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   GET /api/auth/users
// @desc    الحصول على جميع المستخدمين (للإدارة)
// @access  Private (Admin, Dean)
router.get('/users', protect, async (req, res) => {
  try {
    if (!['admin', 'dean'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: t(req, 'auth.unauthorized'),
      });
    }

    const users = await User.find().select('-password').sort({ email: 1 });
    
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   POST /api/auth/biometric/enable
// @desc    تفعيل البصمة الحيوية للمستخدم
// @access  Private
router.post('/biometric/enable', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.studentNotFound'),
      });
    }

    // تحديث حالة البصمة الحيوية
    student.biometric_enabled = true;
    await student.save();

    res.json({
      success: true,
      message: t(req, 'biometric.enabled'),
      biometric_enabled: true,
    });
  } catch (error) {
    console.error('Enable biometric error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   POST /api/auth/biometric/disable
// @desc    تعطيل البصمة الحيوية للمستخدم
// @access  Private
router.post('/biometric/disable', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.studentNotFound'),
      });
    }

    // تحديث حالة البصمة الحيوية
    student.biometric_enabled = false;
    await student.save();

    res.json({
      success: true,
      message: t(req, 'biometric.disabled'),
      biometric_enabled: false,
    });
  } catch (error) {
    console.error('Disable biometric error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   GET /api/auth/biometric/status
// @desc    الحصول على حالة البصمة الحيوية
// @access  Private
router.get('/biometric/status', protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.studentNotFound'),
      });
    }

    res.json({
      success: true,
      biometric_enabled: student.biometric_enabled || false,
    });
  } catch (error) {
    console.error('Get biometric status error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   POST /api/auth/biometric/login
// @desc    تسجيل الدخول بالبصمة الحيوية (يستخدم email محفوظ محلياً)
// @access  Public
router.post('/biometric/login', [
  body('email').isEmail().withMessage((value, { req }) => t(req, 'auth.emailInvalid')),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: t(req, 'auth.emailInvalid'),
      });
    }

    // التحقق من تفعيل البصمة الحيوية
    const student = await Student.findOne({ user_id: user._id });
    if (!student || !student.biometric_enabled) {
      return res.status(403).json({
        success: false,
        message: t(req, 'biometric.notEnabled'),
      });
    }

    // إرجاع البيانات مع التوكن
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      student: student ? {
        id: student._id,
        full_name: student.full_name,
        student_number: student.student_number,
        department: student.department,
        year_level: student.year_level,
      } : null,
    });
  } catch (error) {
    console.error('Biometric login error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    تحديث ملف المستخدم الشخصي
// @access  Private
router.put('/update-profile', protect, upload.single('avatar'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // إذا تم رفع صورة، أضف مسار الصورة
    if (req.file) {
      updateData.avatar_url = `/uploads/avatars/${req.file.filename}`;
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // تحديث بيانات المستخدم
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // إذا كان طالب، حدث بيانات الطالب أيضاً
    const student = await Student.findOne({ user_id: req.user._id });
    if (student) {
      const studentUpdateData = { ...updateData };
      if (req.file) {
        studentUpdateData.avatar_url = `/uploads/avatars/${req.file.filename}`;
      }
      await Student.findByIdAndUpdate(
        student._id,
        studentUpdateData,
        { new: true, runValidators: true }
      );
    }

    // إرجاع البيانات المحدثة
    const userData = {
      ...updatedUser.toObject(),
      full_name: updateData.full_name || updatedUser.full_name || updatedUser.name,
      name: updateData.full_name || updatedUser.full_name || updatedUser.name,
      avatar_url: updateData.avatar_url || updatedUser.avatar_url || updatedUser.avatar,
      avatar: updateData.avatar || updateData.avatar_url || updatedUser.avatar_url || updatedUser.avatar,
    };

    res.json({
      success: true,
      data: userData,
      message: t(req, 'auth.profileUpdated') || 'تم تحديث الملف الشخصي بنجاح',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError') || 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    تغيير كلمة مرور المستخدم
// @access  Private
router.post('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage((value, { req }) => t(req, 'auth.currentPasswordRequired') || 'كلمة المرور الحالية مطلوبة'),
  body('newPassword').isLength({ min: 6 }).withMessage((value, { req }) => t(req, 'auth.passwordMinLength') || 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // الحصول على المستخدم مع كلمة المرور
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.userNotFound') || 'المستخدم غير موجود',
      });
    }

    // التحقق من كلمة المرور الحالية
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: t(req, 'auth.currentPasswordIncorrect') || 'كلمة المرور الحالية غير صحيحة',
      });
    }

    // تحديث كلمة المرور
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: t(req, 'auth.passwordChanged') || 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError') || 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

