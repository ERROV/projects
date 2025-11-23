const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const pdf = require('pdf-parse');
const { protect } = require('../middleware/auth');




router.post('/extract-text', protect, async (req, res) => {
  try {
    const { pdf_url } = req.body;

    if (!pdf_url) {
      return res.status(400).json({
        success: false,
        message: 'رابط PDF مطلوب',
      });
    }

    
    let pdfBuffer;
    
    if (pdf_url.startsWith('http://') || pdf_url.startsWith('https://')) {
      
      pdfBuffer = await downloadPDF(pdf_url);
    } else if (pdf_url.startsWith('/uploads/')) {
      
      const filePath = path.join(__dirname, '..', pdf_url);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'ملف PDF غير موجود',
        });
      }
      pdfBuffer = fs.readFileSync(filePath);
    } else {
      return res.status(400).json({
        success: false,
        message: 'رابط PDF غير صحيح',
      });
    }

    
    const data = await pdf(pdfBuffer);
    const text = data.text.trim();

    if (!text || text.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن استخراج نص من هذا الملف. قد يكون الملف يحتوي على صور فقط.',
      });
    }

    
    const pages = text.split(/\n\s*\n/).filter(page => page.trim().length > 0);

    res.json({
      success: true,
      data: {
        text: text,
        pages: pages,
        totalPages: data.numpages,
        totalCharacters: text.length,
      },
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل استخراج النص من PDF',
      error: error.message,
    });
  }
});


function downloadPDF(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`فشل تحميل الملف: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });

      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });

      response.on('error', (error) => {
        reject(error);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = router;

