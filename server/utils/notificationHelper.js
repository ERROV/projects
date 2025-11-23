const Notification = require('../models/Notification');
const Student = require('../models/Student');

/**
 * إنشاء إشعار تلقائي
 */
const createNotification = async (data) => {
  try {
    const notification = await Notification.create({
      user_id: data.user_id,
      student_id: data.student_id,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      category: data.category || 'general',
      priority: data.priority || 'medium',
      action_url: data.action_url,
      action_data: data.action_data,
      sent_at: new Date(),
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * إشعار عند إنشاء دفعة جديدة
 */
const notifyNewPayment = async (payment, student) => {
  const language = 'ar'; // يمكن جلبها من الطالب لاحقاً
  
  const title = language === 'ar' 
    ? 'دفعة جديدة مطلوبة' 
    : 'New Payment Required';
  
  const message = language === 'ar'
    ? `تم إنشاء دفعة جديدة بقيمة ${payment.amount} دينار. تاريخ الاستحقاق: ${new Date(payment.due_date).toLocaleDateString('ar-IQ')}`
    : `A new payment of ${payment.amount} IQD has been created. Due date: ${new Date(payment.due_date).toLocaleDateString('en-US')}`;

  return await createNotification({
    user_id: student.user_id,
    student_id: student._id,
    title,
    message,
    type: 'payment',
    category: 'payment',
    priority: 'high',
    action_url: '/tuition',
    action_data: { payment_id: payment._id },
  });
};

/**
 * إشعار عند إنشاء استعارة جديدة
 */
const notifyNewBorrowing = async (borrowing, student, book) => {
  const language = 'ar';
  
  const title = language === 'ar'
    ? 'تم استعارة كتاب جديد'
    : 'New Book Borrowed';
  
  const message = language === 'ar'
    ? `تم استعارة كتاب "${book.title}" بنجاح. تاريخ الاسترجاع: ${new Date(borrowing.due_date).toLocaleDateString('ar-IQ')}`
    : `Book "${book.title}" has been borrowed successfully. Return date: ${new Date(borrowing.due_date).toLocaleDateString('en-US')}`;

  return await createNotification({
    user_id: student.user_id,
    student_id: student._id,
    title,
    message,
    type: 'borrowing',
    category: 'borrowing',
    priority: 'medium',
    action_url: '/library',
    action_data: { borrowing_id: borrowing._id, book_id: book._id },
  });
};

/**
 * إشعار قبل موعد استرجاع الكتاب
 */
const notifyBorrowingDueSoon = async (borrowing, student, book) => {
  const language = 'ar';
  const daysUntilDue = Math.ceil((new Date(borrowing.due_date) - new Date()) / (1000 * 60 * 60 * 24));
  
  const title = language === 'ar'
    ? 'تذكير: موعد استرجاع الكتاب قريب'
    : 'Reminder: Book Return Date Approaching';
  
  const message = language === 'ar'
    ? `يرجى إرجاع كتاب "${book.title}" خلال ${daysUntilDue} يوم${daysUntilDue > 1 ? 'ات' : ''}. تاريخ الاسترجاع: ${new Date(borrowing.due_date).toLocaleDateString('ar-IQ')}`
    : `Please return book "${book.title}" within ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}. Return date: ${new Date(borrowing.due_date).toLocaleDateString('en-US')}`;

  return await createNotification({
    user_id: student.user_id,
    student_id: student._id,
    title,
    message,
    type: 'warning',
    category: 'borrowing',
    priority: daysUntilDue <= 2 ? 'urgent' : 'high',
    action_url: '/library',
    action_data: { borrowing_id: borrowing._id, book_id: book._id },
  });
};

/**
 * إشعار قبل المحاضرة
 */
const notifyUpcomingLecture = async (student, lectureInfo) => {
  const language = 'ar';
  
  const title = language === 'ar'
    ? 'تذكير: محاضرة قادمة'
    : 'Reminder: Upcoming Lecture';
  
  const message = language === 'ar'
    ? `لديك محاضرة "${lectureInfo.subject}" في ${lectureInfo.time} في القاعة ${lectureInfo.room}`
    : `You have a lecture "${lectureInfo.subject}" at ${lectureInfo.time} in room ${lectureInfo.room}`;

  return await createNotification({
    user_id: student.user_id,
    student_id: student._id,
    title,
    message,
    type: 'lecture',
    category: 'lecture',
    priority: 'medium',
    action_url: '/schedule',
    action_data: { lecture_id: lectureInfo._id },
  });
};

/**
 * إشعار عند تأخر الدفعة
 */
const notifyOverduePayment = async (payment, student) => {
  const language = 'ar';
  
  const title = language === 'ar'
    ? 'تنبيه: دفعة متأخرة'
    : 'Alert: Overdue Payment';
  
  const message = language === 'ar'
    ? `دفعة بقيمة ${payment.amount} دينار متأخرة. يرجى الدفع في أقرب وقت ممكن.`
    : `Payment of ${payment.amount} IQD is overdue. Please pay as soon as possible.`;

  return await createNotification({
    user_id: student.user_id,
    student_id: student._id,
    title,
    message,
    type: 'error',
    category: 'payment',
    priority: 'urgent',
    action_url: '/tuition',
    action_data: { payment_id: payment._id },
  });
};

module.exports = {
  createNotification,
  notifyNewPayment,
  notifyNewBorrowing,
  notifyBorrowingDueSoon,
  notifyUpcomingLecture,
  notifyOverduePayment,
};

