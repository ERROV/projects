const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../.env') });

// استيراد النماذج
const User = require('../models/User');
const Student = require('../models/Student');
const Book = require('../models/Book');
const Lecture = require('../models/Lecture');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const News = require('../models/News');
const Borrowing = require('../models/Borrowing');
const Department = require('../models/Department');
const Barcode = require('../models/Barcode');
const Schedule = require('../models/Schedule');
const QRCode = require('qrcode');

// الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alhikma-university');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// حذف جميع البيانات
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Student.deleteMany();
    await Book.deleteMany();
    await Lecture.deleteMany();
    await Attendance.deleteMany();
    await Payment.deleteMany();
    await News.deleteMany();
    await Borrowing.deleteMany();
    await Department.deleteMany();
    await Barcode.deleteMany();
    await Schedule.deleteMany();
    console.log('Data deleted');
  } catch (error) {
    console.error('Error deleting data:', error);
  }
};

// إنشاء بيانات أولية
const seedData = async () => {
  try {
    // إنشاء مستخدمين
    const user1 = await User.create({
      email: 'ahmed@example.com',
      password: '123456',
      role: 'student',
    });

    const user2 = await User.create({
      email: 'fatima@example.com',
      password: '123456',
      role: 'student',
    });

    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
    });

    const deanUser = await User.create({
      email: 'dean@example.com',
      password: 'dean123',
      role: 'dean',
    });

    // إنشاء الأقسام
    const deptCS = await Department.create({
      name: 'هندسة تقنيات الحاسوب',
      code: 'CS',
      description: 'قسم هندسة تقنيات الحاسوب يقدم برامج دراسية متقدمة في علوم الحاسوب والبرمجة',
      tuition_fee: 1500000, // 1.5 مليون دينار
      manager_id: deanUser._id,
      is_active: true,
    });

    const deptMATH = await Department.create({
      name: 'الرياضيات',
      code: 'MATH',
      description: 'قسم الرياضيات يقدم برامج دراسية في الرياضيات التطبيقية والنظرية',
      tuition_fee: 1200000, // 1.2 مليون دينار
      is_active: true,
    });

    const deptPHYS = await Department.create({
      name: 'الفيزياء',
      code: 'PHYS',
      description: 'قسم الفيزياء يقدم برامج دراسية في الفيزياء النظرية والتطبيقية',
      tuition_fee: 1300000, // 1.3 مليون دينار
      is_active: true,
    });

    // إنشاء جداول لكل قسم ومرحلة
    const schedules = [];
    const departments = [deptCS, deptMATH, deptPHYS];
    const academicYear = '2024-2025';
    const semester = 'الفصل الأول';
    
    for (const dept of departments) {
      for (let year = 1; year <= 5; year++) {
        // إنشاء جدول لكل قسم ومرحلة
        const weekSchedule = [
          {
            day: 'السبت',
            lectures: [
              {
                course_name: `مقدمة في ${dept.name}`,
                course_code: `${dept.code}${year}01`,
                instructor_name: 'د. علي محمد',
                room_number: `A${year}01`,
                start_time: '08:00',
                end_time: '09:30',
                lecture_type: 'نظري',
              },
            ],
          },
          {
            day: 'الأحد',
            lectures: [
              {
                course_name: `أساسيات ${dept.name}`,
                course_code: `${dept.code}${year}02`,
                instructor_name: 'د. فاطمة حسن',
                room_number: `A${year}02`,
                start_time: '10:00',
                end_time: '11:30',
                lecture_type: 'نظري',
              },
            ],
          },
        ];

        const schedule = await Schedule.create({
          department_id: dept._id,
          department_name: dept.name,
          year_level: year,
          academic_year: academicYear,
          semester: semester,
          week_schedule: weekSchedule,
          created_by: adminUser._id,
          is_active: true,
        });
        schedules.push(schedule);
      }
    }

    // إعادة جلب الجداول من قاعدة البيانات للتأكد من البيانات
    const schedulesFromDB = await Schedule.find({ _id: { $in: schedules.map(s => s._id) } });
    
    // إنشاء باركودات لكل محاضرة في الجداول
    const barcodes = [];
    for (const schedule of schedulesFromDB) {
      // التأكد من أن week_schedule موجود
      if (!schedule.week_schedule || !Array.isArray(schedule.week_schedule)) {
        console.log(`⚠️ تحذير: الجدول ${schedule._id} لا يحتوي على week_schedule`);
        continue;
      }

      for (const daySchedule of schedule.week_schedule) {
        // التأكد من أن lectures موجود
        if (!daySchedule.lectures || !Array.isArray(daySchedule.lectures)) {
          console.log(`⚠️ تحذير: اليوم ${daySchedule.day} لا يحتوي على محاضرات`);
          continue;
        }

        for (const lecture of daySchedule.lectures) {
          // التحقق من وجود جميع الحقول المطلوبة
          if (!lecture.course_name || !lecture.instructor_name || !lecture.room_number || 
              !daySchedule.day || !lecture.start_time || !lecture.end_time) {
            console.log(`⚠️ تحذير: محاضرة ناقصة البيانات:`, lecture);
            continue;
          }

          try {
            // حساب وقت انتهاء الباركود (وقت انتهاء المحاضرة)
            const today = new Date();
            const [hours, minutes] = lecture.end_time.split(':');
            const expiryDate = new Date(today);
            expiryDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // إذا كان وقت الانتهاء في الماضي، أضفه لليوم التالي
            if (expiryDate < today) {
              expiryDate.setDate(expiryDate.getDate() + 1);
            }

            // إنشاء باركود فريد
            const barcodeValue = `${schedule.department_name}-${schedule.year_level}-${lecture.course_code || 'LEC'}-${daySchedule.day}-${lecture.start_time}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            let qrCodeBase64 = '';
            try {
              qrCodeBase64 = await QRCode.toDataURL(barcodeValue);
            } catch (err) {
              console.error('QR Code generation error:', err);
            }
            
            const barcodeData = {
              schedule_id: schedule._id,
              lecture_info: {
                course_name: lecture.course_name,
                course_code: lecture.course_code || '',
                instructor_name: lecture.instructor_name,
                room_number: lecture.room_number,
                day_of_week: daySchedule.day,
                start_time: lecture.start_time,
                end_time: lecture.end_time,
                lecture_type: lecture.lecture_type || 'نظري',
              },
              department_id: schedule.department_id,
              department_name: schedule.department_name,
              year_level: schedule.year_level,
              barcode: barcodeValue,
              qr_code: qrCodeBase64,
              expiry_time: expiryDate,
              created_by: adminUser._id,
              is_active: true,
            };

            const barcode = await Barcode.create(barcodeData);
            barcodes.push(barcode);
          } catch (error) {
            console.error(`❌ خطأ في إنشاء باركود للمحاضرة ${lecture.course_name}:`, error.message);
          }
        }
      }
    }

    // إنشاء طلاب
    const student1 = await Student.create({
      user_id: user1._id,
      email: 'ahmed@example.com',
      full_name: 'أحمد محمد علي',
      student_number: '202310001',
      phone: '07901234567',
      department_id: deptCS._id,
      department: deptCS.name,
      year_level: 3,
      biometric_enabled: true,
      face_encoding: Buffer.from('mock_face_encoding_ahmed').toString('base64'),
    });

    const student2 = await Student.create({
      user_id: user2._id,
      email: 'fatima@example.com',
      full_name: 'فاطمة حسن إبراهيم',
      student_number: '202310002',
      phone: '07901234568',
      department_id: deptCS._id,
      department: deptCS.name,
      year_level: 2,
      biometric_enabled: false,
    });

    // إنشاء كتب
    const books = await Book.create([
      {
        title: 'مبادئ علوم الحاسوب',
        author: 'د. علي محمد',
        isbn: '978-1-23456-789-7',
        year: 2020,
        category: 'علوم الحاسوب',
        description: 'كتاب تمهيدي لأساسيات علوم الحاسوب.',
        total_copies: 5,
        available_copies: 3,
        cover_image_url: '/uploads/books/book1.png',
        digital_version_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
      {
        title: 'قواعد البيانات المتقدمة',
        author: 'د. فاطمة حسن',
        isbn: '978-1-23456-789-8',
        year: 2021,
        category: 'علوم الحاسوب',
        description: 'تغطية متقدمة لنظم إدارة قواعد البيانات.',
        total_copies: 3,
        available_copies: 1,
        cover_image_url: '/uploads/books/book2.png',
        digital_version_url: 'https://www.orimi.com/pdf-test.pdf',
      },
      {
        title: 'تعلم React Native',
        author: 'محمد أحمد',
        category: 'علوم الحاسوب',
        total_copies: 5,
        available_copies: 3,
        cover_image_url: '/uploads/books/book3.png',
      },
      {
        title: 'الذكاء الاصطناعي',
        author: 'فاطمة عمر',
        category: 'علوم الحاسوب',
        total_copies: 4,
        available_copies: 2,
        cover_image_url: '/uploads/books/book4.png',
        digital_version_url: 'https://example.com/book3.pdf',
      },
      {
        title: 'التفاضل والتكامل',
        author: 'خالد إبراهيم',
        category: 'الرياضيات',
        total_copies: 5,
        available_copies: 5,
        cover_image_url: '/uploads/books/book5.png',
      },
      {
        title: 'فيزياء الكم',
        author: 'سارة محمد',
        category: 'الفيزياء',
        total_copies: 3,
        available_copies: 1,
        cover_image_url: '/uploads/books/book6.png',
        digital_version_url: 'https://example.com/book5.pdf',
      },
    ]);

    // إنشاء محاضرات لكل قسم ومرحلة
    const lectures = [];
    
    // محاضرات قسم الحاسوب - المرحلة 1
    lectures.push(...await Lecture.create([
      {
        course_code: 'CS101',
        course_name: 'مقدمة في البرمجة',
        instructor_name: 'د. علي محمد',
        room_number: 'A101',
        day_of_week: 'السبت',
        start_time: '08:00',
        end_time: '09:30',
        credits: 3,
        department: deptCS.name,
        semester: 1,
      },
      {
        course_code: 'CS102',
        course_name: 'أساسيات الحاسوب',
        instructor_name: 'د. فاطمة حسن',
        room_number: 'A102',
        day_of_week: 'السبت',
        start_time: '10:00',
        end_time: '11:30',
        credits: 3,
        department: deptCS.name,
        semester: 1,
      },
    ]));

    // محاضرات قسم الحاسوب - المرحلة 2
    lectures.push(...await Lecture.create([
      {
        course_code: 'CS201',
        course_name: 'برمجة الويب',
        instructor_name: 'د. محمد حسن',
        room_number: 'B201',
        day_of_week: 'الأحد',
        start_time: '08:00',
        end_time: '10:00',
        credits: 3,
        department: deptCS.name,
        semester: 1,
      },
      {
        course_code: 'CS202',
        course_name: 'قواعد البيانات',
        instructor_name: 'د. علي إبراهيم',
        room_number: 'B202',
        day_of_week: 'الأحد',
        start_time: '10:30',
        end_time: '12:30',
        credits: 3,
        department: deptCS.name,
        semester: 1,
      },
    ]));

    // محاضرات قسم الحاسوب - المرحلة 3
    lectures.push(...await Lecture.create([
      {
        course_code: 'CS301',
        course_name: 'برمجة متقدمة',
        instructor_name: 'د. أحمد سالم',
        room_number: 'C301',
        day_of_week: 'السبت',
        start_time: '08:00',
        end_time: '10:00',
        credits: 3,
        department: deptCS.name,
        semester: 1,
      },
      {
        course_code: 'CS302',
        course_name: 'قواعد البيانات المتقدمة',
        instructor_name: 'د. سارة علي',
        room_number: 'C302',
        day_of_week: 'السبت',
        start_time: '10:30',
        end_time: '12:30',
        credits: 3,
        department: deptCS.name,
        semester: 1,
      },
    ]));

    // محاضرات قسم الرياضيات
    lectures.push(...await Lecture.create([
      {
        course_code: 'MATH101',
        course_name: 'الجبر الخطي',
        instructor_name: 'د. خالد إبراهيم',
        room_number: 'D101',
        day_of_week: 'الاثنين',
        start_time: '08:00',
        end_time: '09:30',
        credits: 4,
        department: deptMATH.name,
        semester: 1,
      },
      {
        course_code: 'MATH201',
        course_name: 'التفاضل والتكامل',
        instructor_name: 'د. نورا محمد',
        room_number: 'D201',
        day_of_week: 'الاثنين',
        start_time: '10:00',
        end_time: '11:30',
        credits: 4,
        department: deptMATH.name,
        semester: 1,
      },
    ]));

    // محاضرات قسم الفيزياء
    lectures.push(...await Lecture.create([
      {
        course_code: 'PHYS101',
        course_name: 'فيزياء عامة',
        instructor_name: 'د. عمر أحمد',
        room_number: 'E101',
        day_of_week: 'الثلاثاء',
        start_time: '08:00',
        end_time: '09:30',
        credits: 3,
        department: deptPHYS.name,
        semester: 1,
      },
    ]));

    // إنشاء سجلات حضور (باستخدام NFC وباركود)
    const today = new Date().toISOString().split('T')[0];
    const student1Barcode = barcodes.find(b => 
      b.department_id.toString() === deptCS._id.toString() && 
      b.year_level === student1.year_level
    );
    
    if (student1Barcode) {
      await Attendance.create([
        {
          student_id: student1._id,
          date: today,
          check_in_time: '08:02:10',
          check_out_time: '12:00:00',
          nfc_card_id: 'NFC_1001',
          barcode: student1Barcode.barcode,
          barcode_id: student1Barcode._id,
          department_id: deptCS._id,
          year_level: student1.year_level,
          status: 'present',
          lecture_id: lectures[4]?._id, // محاضرة المرحلة 3
          lecture_name: lectures[4]?.course_name || student1Barcode.lecture_info.course_name,
        },
      ]);
    }

    // إنشاء دفعات للطلاب (4 دفعات لكل طالب حسب قسمه)
    const paymentSemester = 'الفصل الأول 2024-2025';
    // استخدام نفس academicYear المحدد في بداية الدالة
    
    // دفعات للطالب 1 (قسم الحاسوب - قسط 1.5 مليون)
    const student1InstallmentAmount = deptCS.tuition_fee / 4; // 375,000
    const startDate1 = new Date('2024-09-01');
    
    for (let i = 0; i < 4; i++) {
      const dueDate = new Date(startDate1);
      dueDate.setMonth(dueDate.getMonth() + (i * 3));
      
      await Payment.create({
        student_id: student1._id,
        department_id: deptCS._id,
        amount: student1InstallmentAmount,
        paid_amount: i === 0 ? student1InstallmentAmount : (i === 1 ? student1InstallmentAmount / 2 : 0),
        remaining_amount: i === 0 ? 0 : (i === 1 ? student1InstallmentAmount / 2 : student1InstallmentAmount),
        due_date: dueDate,
        payment_date: i === 0 ? new Date(startDate1) : (i === 1 ? new Date(dueDate) : null),
        status: i === 0 ? 'paid' : (i === 1 ? 'partial' : 'pending'),
        semester: paymentSemester,
        academic_year: academicYear,
        installment_number: i + 1,
        type: 'رسوم دراسية',
        payment_method: i === 0 ? 'نقد' : (i === 1 ? 'تحويل بنكي' : null),
      });
    }

    // دفعات للطالب 2 (قسم الحاسوب - قسط 1.5 مليون)
    const student2InstallmentAmount = deptCS.tuition_fee / 4; // 375,000
    const startDate2 = new Date('2024-09-01');
    
    for (let i = 0; i < 4; i++) {
      const dueDate = new Date(startDate2);
      dueDate.setMonth(dueDate.getMonth() + (i * 3));
      
      await Payment.create({
        student_id: student2._id,
        department_id: deptCS._id,
        amount: student2InstallmentAmount,
        paid_amount: 0,
        remaining_amount: student2InstallmentAmount,
        due_date: dueDate,
        status: 'pending',
        semester: paymentSemester,
        academic_year: academicYear,
        installment_number: i + 1,
        type: 'رسوم دراسية',
      });
    }

    // إنشاء أخبار وفعاليات
    await News.create([
      {
        title: 'افتتاح معرض الكتاب السنوي في الكلية',
        content: 'تتشرف كلية الحكمة الجامعة بدعوتكم لحضور معرض الكتاب السنوي الذي سيضم أحدث الإصدارات في مجال الهندسة والتكنولوجيا. سيكون المعرض متاحاً لجميع الطلاب وأعضاء الهيئة التدريسية.',
        type: 'event',
        image_url: '/uploads/news/event1.jpg',
        event_date: new Date('2024-03-15'),
        published_at: new Date('2024-02-20'),
        location: 'بهو الكلية الرئيسي',
        organizer: 'قسم النشاطات الطلابية',
      },
      {
        title: 'نتائج الامتحانات النهائية للفصل الأول',
        content: 'تم الإعلان عن نتائج الامتحانات النهائية للفصل الأول 2023-2024. يمكن للطلاب الاطلاع على النتائج عبر النظام الإلكتروني أو مراجعة شؤون الطلبة.',
        type: 'news',
        image_url: '/uploads/news/news1.jpg',
        published_at: new Date('2024-02-18'),
      },
      {
        title: 'ورشة عمل في تطوير تطبيقات الجوال',
        content: 'ينظم قسم هندسة تقنيات الحاسوب ورشة عمل متخصصة في تطوير تطبيقات الجوال باستخدام React Native. الورشة مجانية ومتاحة لجميع طلاب القسم.',
        type: 'event',
        image_url: '/uploads/news/event2.jpg',
        event_date: new Date('2024-03-10'),
        published_at: new Date('2024-02-15'),
        location: 'المعمل 305',
        organizer: 'قسم هندسة تقنيات الحاسوب',
      },
      {
        title: 'تحديث نظام المكتبة الرقمية',
        content: 'تم تحديث نظام المكتبة الرقمية بإضافة أكثر من 500 كتاب إلكتروني جديد في مختلف التخصصات العلمية. يمكن للطلاب الوصول للمكتبة عبر التطبيق أو الموقع الإلكتروني.',
        type: 'news',
        image_url: '/uploads/news/news2.jpg',
        published_at: new Date('2024-02-12'),
      },
    ]);

    // إنشاء استعارات
    await Borrowing.create([
      {
        student_id: student1._id,
        book_id: books[0]._id,
        borrow_date: new Date(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
      {
        student_id: student1._id,
        book_id: books[2]._id,
        borrow_date: new Date(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
      },
    ]);

    console.log('Data seeded successfully');
    console.log('\n=== بيانات الدخول ===');
    console.log('طالب 1:');
    console.log('  Email: ahmed@example.com');
    console.log('  Password: 123456');
    console.log('  القسم: هندسة تقنيات الحاسوب - المرحلة 3');
    console.log('\nطالب 2:');
    console.log('  Email: fatima@example.com');
    console.log('  Password: 123456');
    console.log('  القسم: هندسة تقنيات الحاسوب - المرحلة 2');
    console.log('\nمدير:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
    console.log('\nعميد:');
    console.log('  Email: dean@example.com');
    console.log('  Password: dean123');
    console.log('\n=== الأقسام ===');
    console.log(`- ${deptCS.name}: ${deptCS.tuition_fee.toLocaleString()} IQD`);
    console.log(`- ${deptMATH.name}: ${deptMATH.tuition_fee.toLocaleString()} IQD`);
    console.log(`- ${deptPHYS.name}: ${deptPHYS.tuition_fee.toLocaleString()} IQD`);
    console.log('\n=== الجداول ===');
    console.log(`تم إنشاء ${schedules.length} جدول (${departments.length} أقسام × 5 مراحل)`);
    console.log('\n=== الباركودات ===');
    console.log(`تم إنشاء ${barcodes.length} باركود`);
    console.log('\n========================');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

// تشغيل الـ seed
const runSeed = async () => {
  await connectDB();
  await deleteData();
  await seedData();
  process.exit();
};

runSeed();

