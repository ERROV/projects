const express = require('express');
const router = express.Router();
const BookReview = require('../models/BookReview');
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');




router.get('/:bookId', async (req, res) => {
  try {
    const reviews = await BookReview.find({ book_id: req.params.bookId })
      .populate('user_id', 'email role')
      .sort({ createdAt: -1 });

    
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      count: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      data: reviews,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/', protect, async (req, res) => {
  try {
    const { book_id, rating, comment } = req.body;

    if (!book_id || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول مطلوبة',
      });
    }

    
    const book = await Book.findById(book_id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'الكتاب غير موجود',
      });
    }

    
    const existingReview = await BookReview.findOne({
      book_id,
      user_id: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'لديك مراجعة سابقة لهذا الكتاب',
      });
    }

    const review = await BookReview.create({
      book_id,
      user_id: req.user._id,
      rating: parseInt(rating),
      comment: comment.trim(),
    });

    const populatedReview = await BookReview.findById(review._id)
      .populate('user_id', 'email role');

    res.status(201).json({
      success: true,
      message: 'تم إضافة المراجعة بنجاح',
      data: populatedReview,
    });
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'لديك مراجعة سابقة لهذا الكتاب',
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
    const review = await BookReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'المراجعة غير موجودة',
      });
    }

    
    if (review.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتعديل هذه المراجعة',
      });
    }

    const updateData = { ...req.body };
    if (updateData.rating) {
      updateData.rating = parseInt(updateData.rating);
    }
    if (updateData.comment) {
      updateData.comment = updateData.comment.trim();
    }

    const updatedReview = await BookReview.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user_id', 'email role');

    res.json({
      success: true,
      message: 'تم تحديث المراجعة بنجاح',
      data: updatedReview,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await BookReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'المراجعة غير موجودة',
      });
    }

    
    if (review.user_id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بحذف هذه المراجعة',
      });
    }

    await BookReview.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف المراجعة بنجاح',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

