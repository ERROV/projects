const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');




router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'الكتاب غير موجود',
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/', protect, upload.single('cover_image'), async (req, res) => {
  try {
    const bookData = req.body;
    
    if (req.file) {
      bookData.cover_image_url = `/uploads/books/${req.file.filename}`;
    }

    const book = await Book.create(bookData);

    res.status(201).json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.put('/:id', protect, upload.single('cover_image'), async (req, res) => {
  try {
    let bookData = req.body;
    
    if (req.file) {
      bookData.cover_image_url = `/uploads/books/${req.file.filename}`;
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      bookData,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'الكتاب غير موجود',
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.delete('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'الكتاب غير موجود',
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الكتاب بنجاح',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

