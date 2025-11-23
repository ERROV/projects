const express = require('express');
const router = express.Router();
const axios = require('axios');
const NodeCache = require('node-cache');
const { protect } = require('../middleware/auth');
const { t } = require('../utils/i18n');

const OPEN_LIBRARY_API = 'https://openlibrary.org';
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1';

// Cache للكتب الخارجية (TTL: 1 ساعة)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * @route   GET /api/external-books/search
 * @desc    البحث عن كتب من Open Library و Google Books
 * @access  Private
 */
router.get('/search', protect, async (req, res) => {
  try {
    const { q, page = 1, limit = 20, source = 'all' } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: t(req, 'books.searchQueryRequired'),
      });
    }

    // التحقق من الـ cache
    const cacheKey = `search_${q}_${page}_${limit}_${source}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const books = [];
    let totalResults = 0;

    // البحث في Open Library
    if (source === 'all' || source === 'openlibrary') {
      try {
        const openLibResponse = await axios.get(`${OPEN_LIBRARY_API}/search.json`, {
          params: {
            q: q.trim(),
            page: parseInt(page),
            limit: Math.ceil(parseInt(limit) / 2),
            fields: 'key,title,author_name,first_publish_year,isbn,cover_i,subject,language',
          },
          timeout: 10000,
        });

        const openLibBooks = (openLibResponse.data.docs || []).map((book) => ({
          _id: book.key?.replace('/works/', '') || `ol_${Date.now()}_${Math.random()}`,
          title: book.title || 'Untitled',
          author: Array.isArray(book.author_name) ? book.author_name.join(', ') : (book.author_name || 'Unknown Author'),
          isbn: Array.isArray(book.isbn) ? book.isbn[0] : (book.isbn || null),
          publish_year: book.first_publish_year || null,
          cover_url: book.cover_i 
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : null,
          thumbnail_url: book.cover_i 
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null,
          subjects: book.subject || [],
          language: Array.isArray(book.language) ? book.language[0] : (book.language || 'en'),
          source: 'openlibrary',
          external_id: book.key,
          api_source: 'openlibrary',
        }));

        books.push(...openLibBooks);
        totalResults += openLibResponse.data.numFound || 0;
      } catch (error) {
        console.error('Open Library search error:', error);
      }
    }

    // البحث في Google Books
    if (source === 'all' || source === 'googlebooks') {
      try {
        const startIndex = (parseInt(page) - 1) * Math.ceil(parseInt(limit) / 2);
        const googleResponse = await axios.get(`${GOOGLE_BOOKS_API}/volumes`, {
          params: {
            q: q.trim(),
            startIndex: startIndex,
            maxResults: Math.ceil(parseInt(limit) / 2),
            // إزالة langRestrict لأنه قد يسبب مشاكل
          },
          timeout: 15000,
        });

        if (googleResponse.data && googleResponse.data.items && googleResponse.data.items.length > 0) {
          const googleBooks = googleResponse.data.items
            .filter((item) => item.volumeInfo && item.volumeInfo.title) // تصفية الكتب بدون عنوان
            .map((item) => {
              const volumeInfo = item.volumeInfo || {};
              return {
                _id: item.id || `gb_${Date.now()}_${Math.random()}`,
                title: volumeInfo.title || 'Untitled',
                author: volumeInfo.authors?.join(', ') || 'Unknown Author',
                isbn: volumeInfo.industryIdentifiers?.[0]?.identifier || null,
                publish_year: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : null,
                cover_url: volumeInfo.imageLinks?.large || 
                          (volumeInfo.imageLinks?.thumbnail ? volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=3') : null) || 
                          (volumeInfo.imageLinks?.smallThumbnail ? volumeInfo.imageLinks.smallThumbnail.replace('zoom=1', 'zoom=3') : null) || 
                          null,
                thumbnail_url: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null,
                description: volumeInfo.description || null,
                page_count: volumeInfo.pageCount || null,
                language: volumeInfo.language || 'en',
                subjects: volumeInfo.categories || [],
                source: 'googlebooks',
                external_id: item.id,
                preview_link: volumeInfo.previewLink || null,
                api_source: 'googlebooks',
              };
            });

          books.push(...googleBooks);
          totalResults += googleResponse.data.totalItems || 0;
        } else {
          console.log('Google Books: No items found in response');
        }
      } catch (error) {
        console.error('Google Books search error:', error.response?.data || error.message);
        // لا نرمي الخطأ، فقط نسجلها ونستمر مع Open Library
      }
    }

    // خلط النتائج بشكل عشوائي للحصول على تنوع
    const shuffled = books.sort(() => 0.5 - Math.random());
    const limited = shuffled.slice(0, parseInt(limit));

    const response = {
      success: true,
      data: limited,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResults,
        pages: Math.ceil(totalResults / parseInt(limit)),
      },
    };

    // حفظ في الـ cache
    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('External books search error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/external-books/trending
 * @desc    الحصول على الكتب الشائعة من Open Library و Google Books
 * @access  Private
 */
router.get('/trending', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // التحقق من الـ cache
    const cacheKey = `trending_${limit}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const books = [];

    // جلب من Open Library
    try {
      const popularSubjects = [
        'fiction',
        'science',
        'history',
        'philosophy',
        'literature',
        'biography',
        'art',
        'mathematics',
      ];

      const randomSubject = popularSubjects[Math.floor(Math.random() * popularSubjects.length)];

      const openLibResponse = await axios.get(`${OPEN_LIBRARY_API}/subjects/${randomSubject}.json`, {
        params: {
          limit: Math.ceil(parseInt(limit) / 2),
          details: false,
        },
        timeout: 10000,
      });

      const openLibBooks = (openLibResponse.data.works || []).map((work) => ({
        _id: work.key?.replace('/works/', '') || `ol_${Date.now()}_${Math.random()}`,
        title: work.title || 'Untitled',
        author: work.authors?.[0]?.name || 'Unknown Author',
        cover_url: work.cover_id 
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
          : null,
        thumbnail_url: work.cover_id 
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : null,
        publish_year: work.first_publish_year || null,
        source: 'openlibrary',
        external_id: work.key,
        api_source: 'openlibrary',
      }));

      books.push(...openLibBooks);
    } catch (error) {
      console.error('Open Library trending error:', error);
    }

    // جلب من Google Books
    try {
      const googleResponse = await axios.get(`${GOOGLE_BOOKS_API}/volumes`, {
        params: {
          q: 'subject:fiction OR subject:science OR subject:history',
          maxResults: Math.ceil(parseInt(limit) / 2),
          orderBy: 'relevance',
        },
        timeout: 15000,
      });

      if (googleResponse.data && googleResponse.data.items && googleResponse.data.items.length > 0) {
        const googleBooks = googleResponse.data.items
          .filter((item) => item.volumeInfo && item.volumeInfo.title)
          .map((item) => {
            const volumeInfo = item.volumeInfo || {};
            return {
              _id: item.id || `gb_${Date.now()}_${Math.random()}`,
              title: volumeInfo.title || 'Untitled',
              author: volumeInfo.authors?.join(', ') || 'Unknown Author',
              cover_url: volumeInfo.imageLinks?.large || 
                        (volumeInfo.imageLinks?.thumbnail ? volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=3') : null) || 
                        (volumeInfo.imageLinks?.smallThumbnail ? volumeInfo.imageLinks.smallThumbnail.replace('zoom=1', 'zoom=3') : null) || 
                        null,
              thumbnail_url: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null,
              publish_year: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : null,
              description: volumeInfo.description || null,
              isbn: volumeInfo.industryIdentifiers?.[0]?.identifier || null,
              page_count: volumeInfo.pageCount || null,
              language: volumeInfo.language || 'en',
              source: 'googlebooks',
              external_id: item.id,
              preview_link: volumeInfo.previewLink || null,
              api_source: 'googlebooks',
            };
          });

        books.push(...googleBooks);
      }
    } catch (error) {
      console.error('Google Books trending error:', error.response?.data || error.message);
    }

    // خلط الكتب بشكل عشوائي
    const shuffled = books.sort(() => 0.5 - Math.random());
    const limited = shuffled.slice(0, parseInt(limit));

    const response = {
      success: true,
      data: limited,
    };

    // حفظ في الـ cache
    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Trending books error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/external-books/categories
 * @desc    الحصول على فئات الكتب الشائعة (من Open Library و Google Books)
 * @access  Private
 */
router.get('/categories', protect, async (req, res) => {
  try {
    // فئات شائعة من Open Library و Google Books
    const categories = [
      { id: 'fiction', name: { ar: 'رواية', en: 'Fiction' }, icon: '📖' },
      { id: 'science', name: { ar: 'علوم', en: 'Science' }, icon: '🔬' },
      { id: 'history', name: { ar: 'تاريخ', en: 'History' }, icon: '📜' },
      { id: 'philosophy', name: { ar: 'فلسفة', en: 'Philosophy' }, icon: '🤔' },
      { id: 'literature', name: { ar: 'أدب', en: 'Literature' }, icon: '📚' },
      { id: 'biography', name: { ar: 'سيرة ذاتية', en: 'Biography' }, icon: '👤' },
      { id: 'art', name: { ar: 'فن', en: 'Art' }, icon: '🎨' },
      { id: 'mathematics', name: { ar: 'رياضيات', en: 'Mathematics' }, icon: '🔢' },
      { id: 'technology', name: { ar: 'تقنية', en: 'Technology' }, icon: '💻' },
      { id: 'religion', name: { ar: 'دين', en: 'Religion' }, icon: '🕌' },
      { id: 'business', name: { ar: 'أعمال', en: 'Business' }, icon: '💼' },
      { id: 'health', name: { ar: 'صحة', en: 'Health' }, icon: '🏥' },
      { id: 'education', name: { ar: 'تعليم', en: 'Education' }, icon: '🎓' },
      { id: 'psychology', name: { ar: 'علم نفس', en: 'Psychology' }, icon: '🧠' },
      { id: 'cooking', name: { ar: 'طبخ', en: 'Cooking' }, icon: '🍳' },
    ];

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/external-books/category/:category
 * @desc    الحصول على كتب من فئة محددة من Open Library و Google Books
 * @access  Private
 */
router.get('/category/:category', protect, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // التحقق من الـ cache
    const cacheKey = `category_${category}_${page}_${limit}`;
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const books = [];
    let totalResults = 0;

    // جلب من Open Library
    try {
      const openLibResponse = await axios.get(`${OPEN_LIBRARY_API}/subjects/${category}.json`, {
        params: {
          limit: Math.ceil(parseInt(limit) / 2),
          offset: (parseInt(page) - 1) * Math.ceil(parseInt(limit) / 2),
          details: false,
        },
        timeout: 10000,
      });

      const openLibBooks = (openLibResponse.data.works || []).map((work) => ({
        _id: work.key?.replace('/works/', '') || `ol_${Date.now()}_${Math.random()}`,
        title: work.title || 'Untitled',
        author: work.authors?.[0]?.name || 'Unknown Author',
        cover_url: work.cover_id 
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
          : null,
        thumbnail_url: work.cover_id 
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : null,
        publish_year: work.first_publish_year || null,
        source: 'openlibrary',
        external_id: work.key,
        api_source: 'openlibrary',
      }));

      books.push(...openLibBooks);
      totalResults += openLibResponse.data.work_count || 0;
    } catch (error) {
      console.error('Open Library category error:', error);
    }

    // جلب من Google Books
    try {
      const startIndex = (parseInt(page) - 1) * Math.ceil(parseInt(limit) / 2);
      const googleResponse = await axios.get(`${GOOGLE_BOOKS_API}/volumes`, {
        params: {
          q: `subject:${category}`,
          startIndex: startIndex,
          maxResults: Math.ceil(parseInt(limit) / 2),
        },
        timeout: 15000,
      });

      if (googleResponse.data && googleResponse.data.items && googleResponse.data.items.length > 0) {
        const googleBooks = googleResponse.data.items
          .filter((item) => item.volumeInfo && item.volumeInfo.title)
          .map((item) => {
            const volumeInfo = item.volumeInfo || {};
            return {
              _id: item.id || `gb_${Date.now()}_${Math.random()}`,
              title: volumeInfo.title || 'Untitled',
              author: volumeInfo.authors?.join(', ') || 'Unknown Author',
              cover_url: volumeInfo.imageLinks?.large || 
                        (volumeInfo.imageLinks?.thumbnail ? volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=3') : null) || 
                        (volumeInfo.imageLinks?.smallThumbnail ? volumeInfo.imageLinks.smallThumbnail.replace('zoom=1', 'zoom=3') : null) || 
                        null,
              thumbnail_url: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || null,
              publish_year: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : null,
              description: volumeInfo.description || null,
              page_count: volumeInfo.pageCount || null,
              language: volumeInfo.language || 'en',
              source: 'googlebooks',
              external_id: item.id,
              preview_link: volumeInfo.previewLink || null,
              api_source: 'googlebooks',
            };
          });

        books.push(...googleBooks);
        totalResults += googleResponse.data.totalItems || 0;
      }
    } catch (error) {
      console.error('Google Books category error:', error.response?.data || error.message);
    }

    // خلط النتائج
    const shuffled = books.sort(() => 0.5 - Math.random());
    const limited = shuffled.slice(0, parseInt(limit));

    const response = {
      success: true,
      data: limited,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResults,
        pages: Math.ceil(totalResults / parseInt(limit)),
      },
    };

    // حفظ في الـ cache
    cache.set(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Category books error:', error);
    res.status(500).json({
      success: false,
      message: t(req, 'auth.serverError'),
      error: error.message,
    });
  }
});

module.exports = router;

