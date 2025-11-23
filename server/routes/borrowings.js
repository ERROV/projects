const express = require('express');
const router = express.Router();
const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// @route   GET /api/borrowings
// @desc    الحصول على جميع الاستعارات
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // إذا كان المستخدم طالب، عرض استعاراته فقط
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

    const borrowings = await Borrowing.find(query)
      .populate('student_id', 'full_name student_number')
      .populate('book_id')
      .sort({ borrow_date: -1 });

    res.json({
      success: true,
      count: borrowings.length,
      data: borrowings,
    });
  } catch (error) {
    console.error('Get borrowings error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   POST /api/borrowings
// @desc    إنشاء استعارة جديدة
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    let student_id = req.body.student_id;

    // إذا كان المستخدم طالب، استخدام معرفه
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'بيانات الطالب غير موجودة',
        });
      }
      student_id = student._id;
    }

    // التحقق من توفر الكتاب
    const book = await Book.findById(req.body.book_id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'الكتاب غير موجود',
      });
    }

    if (book.available_copies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'لا توجد نسخ متاحة من هذا الكتاب',
      });
    }

    // إنشاء الاستعارة
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 يوم للاستعارة

    const borrowing = await Borrowing.create({
      student_id,
      book_id: req.body.book_id,
      due_date: dueDate,
    });

    // تقليل عدد النسخ المتاحة
    book.available_copies -= 1;
    await book.save();

    const populatedBorrowing = await Borrowing.findById(borrowing._id)
      .populate('student_id', 'full_name student_number')
      .populate('book_id');

    // إرسال إشعار للطالب
    if (populatedBorrowing.student_id && populatedBorrowing.book_id) {
      const student = await Student.findById(populatedBorrowing.student_id._id || populatedBorrowing.student_id);
      if (student) {
        await notifyNewBorrowing(populatedBorrowing, student, populatedBorrowing.book_id);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedBorrowing,
    });
  } catch (error) {
    console.error('Create borrowing error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   PUT /api/borrowings/:id/return
// @desc    إرجاع كتاب
// @access  Private
router.put('/:id/return', protect, async (req, res) => {
  try {
    const borrowing = await Borrowing.findById(req.params.id)
      .populate('book_id');

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'الاستعارة غير موجودة',
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user_id: req.user._id });
      if (student && borrowing.student_id._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بهذا الإجراء',
        });
      }
    }

    if (borrowing.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'تم إرجاع الكتاب مسبقاً',
      });
    }

    // تحديث الاستعارة
    borrowing.return_date = new Date();
    borrowing.status = 'returned';
    await borrowing.save();

    // زيادة عدد النسخ المتاحة
    if (borrowing.book_id) {
      const book = await Book.findById(borrowing.book_id._id);
      if (book) {
        book.available_copies += 1;
        await book.save();
      }
    }

    const updatedBorrowing = await Borrowing.findById(borrowing._id)
      .populate('student_id', 'full_name student_number')
      .populate('book_id');

    res.json({
      success: true,
      data: updatedBorrowing,
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

// @route   DELETE /api/borrowings/:id
// @desc    حذف استعارة
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const borrowing = await Borrowing.findById(req.params.id)
      .populate('book_id');

    if (!borrowing) {
      return res.status(404).json({
        success: false,
        message: 'الاستعارة غير موجودة',
      });
    }

    // إرجاع النسخة إذا لم تكن مسترجعة
    if (borrowing.status !== 'returned' && borrowing.book_id) {
      const book = await Book.findById(borrowing.book_id._id);
      if (book) {
        book.available_copies += 1;
        await book.save();
      }
    }

    await Borrowing.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الاستعارة بنجاح',
    });
  } catch (error) {
    console.error('Delete borrowing error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

