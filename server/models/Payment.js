const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'المبلغ مطلوب'],
    min: 0,
  },
  paid_amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  remaining_amount: {
    type: Number,
    default: function() {
      return this.amount - this.paid_amount;
    },
    min: 0,
  },
  due_date: {
    type: Date,
    required: [true, 'تاريخ الاستحقاق مطلوب'],
  },
  payment_date: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending',
  },
  semester: {
    type: String,
    required: [true, 'الفصل الدراسي مطلوب'],
  },
  academic_year: {
    type: String,
    required: [true, 'السنة الدراسية مطلوبة'],
  },
  installment_number: {
    type: Number,
    required: [true, 'رقم الدفعة مطلوب'],
    min: 1,
    max: 4,
    
  },
  type: {
    type: String,
    enum: ['رسوم دراسية', 'رسوم إضافية'],
    default: 'رسوم دراسية',
  },
  payment_method: {
    type: String,
    enum: ['نقد', 'تحويل بنكي', 'شيك'],
    default: 'نقد',
  },
  receipt_number: {
    type: String,
    
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});


paymentSchema.pre('save', function(next) {
  this.remaining_amount = this.amount - this.paid_amount;
  
  
  if (this.paid_amount === 0) {
    const today = new Date();
    if (this.due_date < today) {
      this.status = 'overdue';
    } else {
      this.status = 'pending';
    }
  } else if (this.paid_amount >= this.amount) {
    this.status = 'paid';
  } else {
    this.status = 'partial';
  }
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

