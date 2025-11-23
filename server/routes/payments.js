const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const { notifyNewPayment } = require('../utils/notificationHelper');

// @route   GET /api/payments
// @desc    الحصول على جميع الدفعات
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // إذا كان المستخدم طالب، عرض دفعاته فقط
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id });
      if (student) {
        query.student_id = student._id;
      }
    } else if (req.query.student_id) {
      query.student_id = req.query.student_id;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const payments = await Payment.find(query)
      .populate('student_id', 'full_name student_number department_id department year_level')
      .populate('department_id', 'name code tuition_fee')
      .sort({ installment_number: 1, due_date: 1 });

    // حساب الإحصائيات
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.paid_amount, 0);
    const totalRemaining = payments.reduce((sum, p) => sum + p.remaining_amount, 0);
    const today = new Date();
    const overdueAmount = payments
      .filter(p => p.status !== 'paid' && new Date(p.due_date) < today)
      .reduce((sum, p) => sum + p.remaining_amount, 0);

    // حساب عدد الدفعات المدفوعة
    const paidInstallments = payments.filter(p => p.status === 'paid').length;
    const totalInstallments = payments.length;

    // معلومات القسم (من أول دفعة أو من الطالب)
    let departmentInfo = null;
    if (payments.length > 0) {
      const firstPayment = payments[0];
      departmentInfo = {
        name: firstPayment.department_id?.name || firstPayment.student_id?.department || 'غير محدد',
        code: firstPayment.department_id?.code || '',
        tuition_fee: firstPayment.department_id?.tuition_fee || 0,
      };
    } else if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id }).populate('department_id', 'name code tuition_fee');
      if (student && student.department_id) {
        departmentInfo = {
          name: student.department_id.name,
          code: student.department_id.code,
          tuition_fee: student.department_id.tuition_fee,
        };
      }
    }

    res.json({
      success: true,
      count: payments.length,
      data: payments,
      stats: {
        totalAmount,
        totalPaid,
        totalRemaining,
        overdueAmount,
        paidInstallments,
        totalInstallments,
      },
      department: departmentInfo,
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   GET /api/payments/:id
// @desc    الحصول على دفعة محددة
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student_id', 'full_name student_number');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة',
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id });
      if (student && payment.student_id._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول لهذه الدفعة',
        });
      }
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   POST /api/payments
// @desc    إنشاء دفعة جديدة
// @access  Private (Admin, Dean, Department Manager, Student Affairs)
router.post('/', protect, authorize('admin', 'dean', 'department_manager', 'student_affairs'), async (req, res) => {
  try {
    const payment = await Payment.create(req.body);

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student_id', 'full_name student_number department')
      .populate('department_id', 'name code');

    // إرسال إشعار للطالب
    if (populatedPayment.student_id) {
      const student = await Student.findById(populatedPayment.student_id._id || populatedPayment.student_id);
      if (student) {
        await notifyNewPayment(populatedPayment, student);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedPayment,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   POST /api/payments/create-installments
// @desc    إنشاء 4 دفعات للطالب (مقسمة على السنة)
// @access  Private (Admin, Dean, Department Manager, Student Affairs)
router.post('/create-installments', protect, authorize('admin', 'dean', 'department_manager', 'student_affairs'), async (req, res) => {
  try {
    const { student_id, academic_year, semester } = req.body;

    if (!student_id || !academic_year || !semester) {
      return res.status(400).json({
        success: false,
        message: 'معاملات مطلوبة: student_id, academic_year, semester',
      });
    }

    // الحصول على بيانات الطالب
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'الطالب غير موجود',
      });
    }

    // الحصول على بيانات القسم
    const department = await Department.findById(student.department_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'قسم الطالب غير موجود',
      });
    }

    // حساب مبلغ كل دفعة (قسط القسم مقسوم على 4)
    const installmentAmount = department.tuition_fee / 4;

    // تواريخ الاستحقاق (كل 3 أشهر)
    const installments = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth());

    for (let i = 0; i < 4; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + (i * 3));

      installments.push({
        student_id: student._id,
        department_id: student.department_id,
        amount: installmentAmount,
        paid_amount: 0,
        remaining_amount: installmentAmount,
        due_date: dueDate,
        status: 'pending',
        semester: semester,
        academic_year: academic_year,
        installment_number: i + 1,
        type: 'رسوم دراسية',
      });
    }

    // إنشاء الدفعات
    const createdPayments = await Payment.insertMany(installments);

    const populatedPayments = await Payment.find({
      _id: { $in: createdPayments.map(p => p._id) },
    })
      .populate('student_id', 'full_name student_number')
      .populate('department_id', 'name code');

    // إرسال إشعارات للطالب عن الدفعات الجديدة
    for (const payment of populatedPayments) {
      if (payment.student_id) {
        const student = await Student.findById(payment.student_id._id || payment.student_id);
        if (student) {
          await notifyNewPayment(payment, student);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء 4 دفعات بنجاح',
      data: populatedPayments,
      count: populatedPayments.length,
    });
  } catch (error) {
    console.error('Create installments error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   POST /api/payments/:id/pay
// @desc    تسجيل دفع بسيط (بدون بوابة دفع)
// @access  Private (Admin, Dean, Department Manager, Student Affairs)
router.post('/:id/pay', protect, authorize('admin', 'dean', 'department_manager', 'student_affairs'), async (req, res) => {
  try {
    const { paid_amount, payment_method, receipt_number, notes } = req.body;

    if (!paid_amount || paid_amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'المبلغ المدفوع مطلوب ويجب أن يكون أكبر من صفر',
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة',
      });
    }

    // تحديث المبلغ المدفوع
    const newPaidAmount = (payment.paid_amount || 0) + paid_amount;
    const newRemainingAmount = payment.amount - newPaidAmount;

    // تحديث الحالة
    let newStatus = payment.status;
    if (newPaidAmount >= payment.amount) {
      newStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partial';
    }

    // تحديث الدفعة
    payment.paid_amount = newPaidAmount;
    payment.remaining_amount = newRemainingAmount;
    payment.status = newStatus;
    payment.payment_date = new Date();
    if (payment_method) payment.payment_method = payment_method;
    if (receipt_number) payment.receipt_number = receipt_number;
    if (notes) payment.notes = (payment.notes || '') + (payment.notes ? '\n' : '') + notes;

    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('student_id', 'full_name student_number')
      .populate('department_id', 'name code');

    res.json({
      success: true,
      message: 'تم تسجيل الدفع بنجاح',
      data: populatedPayment,
    });
  } catch (error) {
    console.error('Pay error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   PUT /api/payments/:id
// @desc    تحديث دفعة
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('student_id', 'full_name student_number');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة',
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   DELETE /api/payments/:id
// @desc    حذف دفعة
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const payment = await Payment.findByIdAndDelete(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة',
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الدفعة بنجاح',
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

