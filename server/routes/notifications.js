const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');
const { t } = require('../utils/i18n');

// @route   GET /api/notifications
// @desc    الحصول على جميع إشعارات المستخدم
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, is_read, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // بناء query
    const query = { user_id: req.user._id };
    
    if (type) {
      query.type = type;
    }
    
    if (is_read !== undefined) {
      query.is_read = is_read === 'true';
    }
    
    if (category) {
      query.category = category;
    }

    // جلب الإشعارات
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // عدد الإشعارات غير المقروءة
    const unreadCount = await Notification.countDocuments({
      user_id: req.user._id,
      is_read: false,
    });

    // إجمالي الإشعارات
    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    الحصول على عدد الإشعارات غير المقروءة
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user_id: req.user._id,
      is_read: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    تحديد إشعار كمقروء
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.userNotFound'),
      });
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    تحديد جميع الإشعارات كمقروءة
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        user_id: req.user._id,
        is_read: false,
      },
      {
        $set: {
          is_read: true,
          read_at: new Date(),
        },
      }
    );

    res.json({
      success: true,
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    حذف إشعار
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: t(req, 'auth.userNotFound'),
      });
    }

    res.json({
      success: true,
      message: (req.headers['x-language'] || 'ar') === 'ar' ? 'تم حذف الإشعار بنجاح' : 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   DELETE /api/notifications
// @desc    حذف جميع الإشعارات
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      user_id: req.user._id,
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   POST /api/notifications
// @desc    إنشاء إشعار جديد (للإدارة فقط)
// @access  Private (Admin, Dean)
router.post('/', protect, async (req, res) => {
  try {
    // التحقق من الصلاحيات
    if (!['admin', 'dean', 'department_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: t(req, 'auth.unauthorized'),
      });
    }

    const {
      user_id,
      student_id,
      title,
      message,
      type = 'info',
      category = 'general',
      priority = 'medium',
      action_url,
      action_data,
      scheduled_at,
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: language === 'ar' ? 'العنوان والمحتوى مطلوبان' : 'Title and message are required',
      });
    }

    // إنشاء الإشعار
    const notificationData = {
      user_id,
      student_id,
      title,
      message,
      type,
      category,
      priority,
      action_url,
      action_data,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
      sent_at: scheduled_at ? undefined : new Date(),
    };

    const notification = await Notification.create(notificationData);

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    إرسال إشعار لجميع الطلاب أو قسم معين
// @access  Private (Admin, Dean)
router.post('/broadcast', protect, async (req, res) => {
  try {
    // التحقق من الصلاحيات
    if (!['admin', 'dean', 'department_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: t(req, 'auth.unauthorized'),
      });
    }

    const {
      title,
      message,
      type = 'info',
      category = 'general',
      priority = 'medium',
      department_id,
      year_level,
      action_url,
      action_data,
      scheduled_at,
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: language === 'ar' ? 'العنوان والمحتوى مطلوبان' : 'Title and message are required',
      });
    }

    // بناء query للطلاب
    const studentQuery = {};
    if (department_id) {
      studentQuery.department_id = department_id;
    }
    if (year_level) {
      studentQuery.year_level = year_level;
    }

    // جلب الطلاب المستهدفين
    const students = await Student.find(studentQuery).select('user_id _id');

    if (students.length === 0) {
      const language = req.headers['x-language'] || 'ar';
      return res.status(400).json({
        success: false,
        message: language === 'ar' ? 'لا يوجد طلاب مستهدفين' : 'No target students found',
      });
    }

    // إنشاء إشعارات لكل طالب
    const notifications = students.map(student => ({
      user_id: student.user_id,
      student_id: student._id,
      title,
      message,
      type,
      category,
      priority,
      action_url,
      action_data,
      scheduled_at: scheduled_at ? new Date(scheduled_at) : undefined,
      sent_at: scheduled_at ? undefined : new Date(),
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      count: createdNotifications.length,
      data: createdNotifications,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

module.exports = router;

