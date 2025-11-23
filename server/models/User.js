const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'dean', 'department_manager', 'instructor', 'student_affairs'],
    default: 'student',
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  full_name: {
    type: String,
  },
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  avatar: {
    type: String,
  },
  avatar_url: {
    type: String,
  },
  address: {
    type: String,
  },
  governorate: {
    type: String,
  },
  city: {
    type: String,
  },
  postal_code: {
    type: String,
  },
  bio: {
    type: String,
  },
  description: {
    type: String,
  },
  facebook: {
    type: String,
  },
  twitter: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  instagram: {
    type: String,
  },
}, {
  timestamps: true,
});


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

