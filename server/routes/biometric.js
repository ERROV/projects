const express = require('express');
const router = express.Router();
const multer = require('multer');
const Student = require('../models/Student');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');


const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});


router.post('/register-face', protect, upload.single('face_image'), async (req, res) => {
  try {
    
    
    
    
    
    
    let faceEncoding = null;
    
    if (req.file) {
      
      faceEncoding = req.file.buffer.toString('base64');
    } else if (req.body.face_encoding) {
      
      faceEncoding = req.body.face_encoding;
    } else {
      return res.status(400).json({
        success: false,
        message: 'صورة الوجه أو encoding مطلوب',
      });
    }

    
    const userId = req.user._id;

    
    const student = await Student.findOneAndUpdate(
      { user_id: userId },
      {
        face_encoding: faceEncoding,
        biometric_enabled: true,
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'بيانات الطالب غير موجودة',
      });
    }

    res.json({
      success: true,
      message: 'تم تسجيل الوجه بنجاح',
      biometric_enabled: true,
    });
  } catch (error) {
    console.error('Register face error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.post('/face-login', upload.single('face_image'), async (req, res) => {
  try {
    
    let faceEncoding = null;
    
    if (req.file) {
      faceEncoding = req.file.buffer.toString('base64');
    } else if (req.body.face_encoding) {
      faceEncoding = req.body.face_encoding;
    } else {
      return res.status(400).json({
        success: false,
        message: 'صورة الوجه أو encoding مطلوب',
      });
    }

    
    
    
    
    
    
    
    
    const students = await Student.find({
      biometric_enabled: true,
      face_encoding: { $exists: true, $ne: null },
    });

    
    
    let matchedStudent = null;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (students.length > 0) {
      
      
      matchedStudent = students[0];
      
      
      
      if (faceEncoding && students.length > 1) {
        const inputEncoding = faceEncoding.substring(0, 100);
        for (const student of students) {
          if (student.face_encoding) {
            const studentEncoding = student.face_encoding.substring(0, 100);
            
            if (inputEncoding === studentEncoding || 
                studentEncoding.includes(inputEncoding.substring(0, 50)) ||
                inputEncoding.includes(studentEncoding.substring(0, 50))) {
              matchedStudent = student;
              break;
            }
          }
        }
      }
    }

    if (!matchedStudent) {
      return res.status(401).json({
        success: false,
        message: 'لم يتم التعرف على الوجه. يرجى المحاولة مرة أخرى أو استخدام البريد الإلكتروني وكلمة المرور',
      });
    }

    
    const user = await User.findById(matchedStudent.user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      student: {
        id: matchedStudent._id,
        full_name: matchedStudent.full_name,
        student_number: matchedStudent.student_number,
        department: matchedStudent.department,
        year_level: matchedStudent.year_level,
      },
    });
  } catch (error) {
    console.error('Face login error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});


router.get('/status', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const student = await Student.findOne({ user_id: userId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'بيانات الطالب غير موجودة',
      });
    }

    res.json({
      success: true,
      biometric_enabled: student.biometric_enabled || false,
      face_registered: !!student.face_encoding,
    });
  } catch (error) {
    console.error('Get biometric status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في السيرفر',
      error: error.message,
    });
  }
});

module.exports = router;

