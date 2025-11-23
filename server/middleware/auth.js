const jwt = require('jsonwebtoken');
const User = require('../models/User');


exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح، يرجى تسجيل الدخول',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح، الرجاء تسجيل الدخول مرة أخرى',
    });
  }
};


exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
      });
    }

    next();
  };
};


exports.sameDepartment = async (req, res, next) => {
  try {
    if (!req.user.department_id) {
      return res.status(403).json({
        success: false,
        message: 'المستخدم غير مرتبط بقسم',
      });
    }

    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من القسم',
    });
  }
};

