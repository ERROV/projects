const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');




router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    const news = await News.find(query).sort({ published_at: -1 });

    res.json({
      success: true,
      count: news.length,
      data: news,
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'الخبر أو الفعالية غير موجودة',
      });
    }

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.post('/', protect, upload.single('news_image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const newsData = req.body;
    
    if (req.file) {
      newsData.image_url = `/uploads/news/${req.file.filename}`;
    }

    const news = await News.create(newsData);

    res.status(201).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.put('/:id', protect, upload.single('news_image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    let newsData = req.body;
    
    if (req.file) {
      newsData.image_url = `/uploads/news/${req.file.filename}`;
    }

    const news = await News.findByIdAndUpdate(
      req.params.id,
      newsData,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'الخبر أو الفعالية غير موجودة',
      });
    }

    res.json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});




router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء',
      });
    }

    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'الخبر أو الفعالية غير موجودة',
      });
    }

    res.json({
      success: true,
      message: 'تم الحذف بنجاح',
    });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

