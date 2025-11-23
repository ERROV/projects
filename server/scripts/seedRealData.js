/**
 * Script لإضافة بيانات حقيقية للعرض
 * يشمل: كتب مع صور، إشعارات، أخبار وفعاليات، أقساط
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// تحميل متغيرات البيئة
dotenv.config({ path: path.join(__dirname, '../.env') });

// استيراد النماذج
const User = require('../models/User');
const Student = require('../models/Student');
const Book = require('../models/Book');
const News = require('../models/News');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Department = require('../models/Department');

// الاتصال بقاعدة البيانات
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alhikma-university');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// إضافة كتب حقيقية مع صور
const seedBooks = async () => {
  try {
    const books = [
      {
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        year: 2008,
        category: 'علوم الحاسوب',
        description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn\'t have to be that way.',
        total_copies: 10,
        available_copies: 7,
        cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400',
        digital_version_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      },
      {
        title: 'The Pragmatic Programmer',
        author: 'Andrew Hunt, David Thomas',
        isbn: '978-0201616224',
        year: 1999,
        category: 'علوم الحاسوب',
        description: 'The Pragmatic Programmer is one of those rare tech books you\'ll read, re-read, and read again over the years. Whether you\'re new to the field or an experienced practitioner, you\'ll come away with fresh insights each and every time.',
        total_copies: 8,
        available_copies: 5,
        cover_image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
        digital_version_url: 'https://www.orimi.com/pdf-test.pdf',
      },
      {
        title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
        author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
        isbn: '978-0201633610',
        year: 1994,
        category: 'علوم الحاسوب',
        description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.',
        total_copies: 6,
        available_copies: 3,
        cover_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
      {
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
        isbn: '978-0262033848',
        year: 2009,
        category: 'علوم الحاسوب',
        description: 'Some books on algorithms are rigorous but incomplete; others cover masses of material but lack rigor. Introduction to Algorithms uniquely combines rigor and comprehensiveness.',
        total_copies: 12,
        available_copies: 9,
        cover_image_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
      },
      {
        title: 'You Don\'t Know JS: Up & Going',
        author: 'Kyle Simpson',
        isbn: '978-1491924464',
        year: 2015,
        category: 'علوم الحاسوب',
        description: 'It\'s easy to learn parts of JavaScript, but much harder to learn it completely—or even sufficiently—whether you\'re new to the language or have used it for years.',
        total_copies: 15,
        available_copies: 12,
        cover_image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400',
      },
      {
        title: 'Eloquent JavaScript',
        author: 'Marijn Haverbeke',
        isbn: '978-1593279509',
        year: 2018,
        category: 'علوم الحاسوب',
        description: 'JavaScript lies at the heart of almost every modern web application, from social apps to the newest browser-based games. Though simple for beginners to pick up and play with, JavaScript is a flexible, complex language.',
        total_copies: 10,
        available_copies: 8,
        cover_image_url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400',
      },
      {
        title: 'React: Up & Running',
        author: 'Stoyan Stefanov',
        isbn: '978-1491931820',
        year: 2016,
        category: 'علوم الحاسوب',
        description: 'Hit the ground running with React, the open-source technology from Facebook for building rich web applications fast. With this practical guide, you\'ll learn how to build components, the building blocks of your apps.',
        total_copies: 9,
        available_copies: 6,
        cover_image_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
      },
      {
        title: 'Node.js Design Patterns',
        author: 'Mario Casciaro',
        isbn: '978-1783287314',
        year: 2014,
        category: 'علوم الحاسوب',
        description: 'Node.js is a massively popular software platform that lets you use JavaScript to easily create scalable server-side applications.',
        total_copies: 7,
        available_copies: 4,
        cover_image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400',
      },
      {
        title: 'Calculus: Early Transcendentals',
        author: 'James Stewart',
        isbn: '978-1285741550',
        year: 2015,
        category: 'الرياضيات',
        description: 'Success in your calculus course starts here! James Stewart\'s CALCULUS texts are world-wide best-sellers for a reason: they are clear, accurate, and filled with relevant, real-world examples.',
        total_copies: 20,
        available_copies: 18,
        cover_image_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      },
      {
        title: 'Linear Algebra Done Right',
        author: 'Sheldon Axler',
        isbn: '978-3319110790',
        year: 2015,
        category: 'الرياضيات',
        description: 'This best-selling textbook for a second course in linear algebra is aimed at undergrad math majors and graduate students.',
        total_copies: 15,
        available_copies: 13,
        cover_image_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
      },
      {
        title: 'The Feynman Lectures on Physics',
        author: 'Richard P. Feynman',
        isbn: '978-0201021158',
        year: 1964,
        category: 'الفيزياء',
        description: 'The Feynman Lectures on Physics is a physics textbook based on some lectures by Richard Feynman, a Nobel laureate who has sometimes been called "The Great Explainer".',
        total_copies: 10,
        available_copies: 7,
        cover_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
      {
        title: 'Introduction to Quantum Mechanics',
        author: 'David J. Griffiths',
        isbn: '978-1107179868',
        year: 2017,
        category: 'الفيزياء',
        description: 'Changes and additions to the new edition of this classic textbook include a new chapter on symmetries, new problems and examples, improved explanations, more numerical problems to be worked on a computer.',
        total_copies: 8,
        available_copies: 5,
        cover_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
      {
        title: 'The Art of Computer Programming',
        author: 'Donald E. Knuth',
        isbn: '978-0201896831',
        year: 1997,
        category: 'علوم الحاسوب',
        description: 'The Art of Computer Programming (TAOCP) is a comprehensive monograph written by computer scientist Donald Knuth that covers many kinds of programming algorithms and their analysis.',
        total_copies: 5,
        available_copies: 2,
        cover_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
      {
        title: 'Structure and Interpretation of Computer Programs',
        author: 'Harold Abelson, Gerald Jay Sussman',
        isbn: '978-0262510875',
        year: 1996,
        category: 'علوم الحاسوب',
        description: 'Structure and Interpretation of Computer Programs has had a dramatic impact on computer science curricula over the past decade.',
        total_copies: 11,
        available_copies: 9,
        cover_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
      {
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
        isbn: '978-0073523323',
        year: 2019,
        category: 'علوم الحاسوب',
        description: 'Database System Concepts by Silberschatz, Korth and Sudarshan is now in its 7th edition and is one of the cornerstone texts of database education.',
        total_copies: 14,
        available_copies: 11,
        cover_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
      },
    ];

    const createdBooks = await Book.insertMany(books);
    console.log(`✅ تم إضافة ${createdBooks.length} كتاب`);
    return createdBooks;
  } catch (error) {
    console.error('❌ Error seeding books:', error);
    return [];
  }
};

// إضافة إشعارات حقيقية
const seedNotifications = async (students) => {
  try {
    if (!students || students.length === 0) {
      console.log('⚠️ لا توجد طلاب لإضافة إشعارات');
      return;
    }

    const notifications = [];
    const now = new Date();

    for (const student of students) {
      // إشعارات للطالب
      notifications.push(
        {
          user_id: student.user_id,
          student_id: student._id,
          title: 'مرحباً بك في تطبيق جامعة الحكمة',
          message: 'نتمنى لك تجربة ممتعة في استخدام التطبيق. يمكنك الآن تصفح المكتبة الرقمية والاطلاع على جدولك الدراسي.',
          type: 'info',
          category: 'general',
          priority: 'low',
          is_read: false,
          sent_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // قبل يومين
        },
        {
          user_id: student.user_id,
          student_id: student._id,
          title: 'دفعة جديدة مستحقة',
          message: 'يوجد لديك دفعة مستحقة قريباً. يرجى مراجعة صفحة الأقساط للاطلاع على التفاصيل.',
          type: 'payment',
          category: 'payment',
          priority: 'high',
          is_read: false,
          action_url: '/tuition',
          sent_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // قبل يوم
        },
        {
          user_id: student.user_id,
          student_id: student._id,
          title: 'محاضرة قادمة',
          message: 'تذكير: لديك محاضرة "مقدمة في البرمجة" غداً الساعة 8:00 صباحاً في القاعة A101.',
          type: 'lecture',
          category: 'lecture',
          priority: 'medium',
          is_read: false,
          action_url: '/schedule',
          sent_at: new Date(now.getTime() - 12 * 60 * 60 * 1000), // قبل 12 ساعة
        },
        {
          user_id: student.user_id,
          student_id: student._id,
          title: 'استعارة كتاب',
          message: 'تم قبول طلب استعارتك للكتاب "Clean Code". يمكنك استلامه من المكتبة.',
          type: 'borrowing',
          category: 'borrowing',
          priority: 'medium',
          is_read: true,
          read_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          action_url: '/library',
          sent_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // قبل 5 أيام
        },
        {
          user_id: student.user_id,
          student_id: student._id,
          title: 'فعالية جديدة',
          message: 'معرض الكتاب السنوي سيقام يوم 15 مارس. لا تفوت الفرصة!',
          type: 'event',
          category: 'event',
          priority: 'low',
          is_read: false,
          action_url: '/news',
          sent_at: new Date(now.getTime() - 6 * 60 * 60 * 1000), // قبل 6 ساعات
        },
        {
          user_id: student.user_id,
          student_id: student._id,
          title: 'تذكير: موعد استرجاع الكتاب',
          message: 'يرجى إرجاع الكتاب "The Pragmatic Programmer" قبل انتهاء مدة الاستعارة.',
          type: 'borrowing',
          category: 'borrowing',
          priority: 'high',
          is_read: false,
          action_url: '/library',
          sent_at: new Date(now.getTime() - 2 * 60 * 60 * 1000), // قبل ساعتين
        }
      );
    }

    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ تم إضافة ${createdNotifications.length} إشعار`);
    return createdNotifications;
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    return [];
  }
};

// إضافة أخبار وفعاليات حقيقية
const seedNews = async () => {
  try {
    const newsItems = [
      {
        title: 'افتتاح معرض الكتاب السنوي في الكلية',
        content: 'تتشرف كلية الحكمة الجامعة بدعوتكم لحضور معرض الكتاب السنوي الذي سيضم أحدث الإصدارات في مجال الهندسة والتكنولوجيا والعلوم. سيكون المعرض متاحاً لجميع الطلاب وأعضاء الهيئة التدريسية من 15 إلى 20 مارس 2024.',
        type: 'event',
        image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
        event_date: new Date('2024-03-15'),
        published_at: new Date('2024-02-20'),
        location: 'بهو الكلية الرئيسي',
        organizer: 'قسم النشاطات الطلابية',
      },
      {
        title: 'نتائج الامتحانات النهائية للفصل الأول',
        content: 'تم الإعلان عن نتائج الامتحانات النهائية للفصل الأول 2023-2024. يمكن للطلاب الاطلاع على النتائج عبر النظام الإلكتروني أو مراجعة شؤون الطلبة في المكتب الرئيسي. مبروك للجميع!',
        type: 'news',
        image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
        published_at: new Date('2024-02-18'),
      },
      {
        title: 'ورشة عمل في تطوير تطبيقات الجوال',
        content: 'ينظم قسم هندسة تقنيات الحاسوب ورشة عمل متخصصة في تطوير تطبيقات الجوال باستخدام React Native و Flutter. الورشة مجانية ومتاحة لجميع طلاب القسم. التسجيل متاح حتى 8 مارس.',
        type: 'event',
        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        event_date: new Date('2024-03-10'),
        published_at: new Date('2024-02-15'),
        location: 'المعمل 305',
        organizer: 'قسم هندسة تقنيات الحاسوب',
      },
      {
        title: 'تحديث نظام المكتبة الرقمية',
        content: 'تم تحديث نظام المكتبة الرقمية بإضافة أكثر من 500 كتاب إلكتروني جديد في مختلف التخصصات العلمية. يمكن للطلاب الوصول للمكتبة عبر التطبيق أو الموقع الإلكتروني. استمتعوا بالقراءة!',
        type: 'news',
        image_url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800',
        published_at: new Date('2024-02-12'),
      },
      {
        title: 'يوم مفتوح للطلاب الجدد',
        content: 'تنظم الكلية يوماً مفتوحاً للطلاب الجدد للتعرف على المرافق والخدمات المتاحة. سيتضمن اليوم جولات في المكتبة والمختبرات وورش عمل تعريفية.',
        type: 'event',
        image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
        event_date: new Date('2024-03-25'),
        published_at: new Date('2024-02-10'),
        location: 'الحرم الجامعي',
        organizer: 'شؤون الطلبة',
      },
      {
        title: 'إطلاق برنامج المنح الدراسية',
        content: 'أعلنت الكلية عن إطلاق برنامج جديد للمنح الدراسية للطلاب المتفوقين. يمكن للطلاب التقديم عبر الموقع الإلكتروني حتى نهاية مارس.',
        type: 'news',
        image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        published_at: new Date('2024-02-08'),
      },
      {
        title: 'مؤتمر التكنولوجيا والابتكار',
        content: 'تنظم الكلية مؤتمراً سنوياً حول التكنولوجيا والابتكار بمشاركة خبراء محليين ودوليين. المؤتمر مفتوح للجميع.',
        type: 'event',
        image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        event_date: new Date('2024-04-05'),
        published_at: new Date('2024-02-05'),
        location: 'القاعة الكبرى',
        organizer: 'قسم البحث العلمي',
      },
      {
        title: 'تحديثات جديدة في التطبيق',
        content: 'تم إضافة ميزات جديدة في تطبيق الجامعة تشمل نظام إشعارات محسّن، واجهة مستخدم جديدة للمكتبة، وتحسينات في نظام الحضور.',
        type: 'news',
        image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800',
        published_at: new Date('2024-02-01'),
      },
    ];

    const createdNews = await News.insertMany(newsItems);
    console.log(`✅ تم إضافة ${createdNews.length} خبر/فعالية`);
    return createdNews;
  } catch (error) {
    console.error('❌ Error seeding news:', error);
    return [];
  }
};

// إضافة أقساط للطلاب
const seedPayments = async (students, departments) => {
  try {
    if (!students || students.length === 0) {
      console.log('⚠️ لا توجد طلاب لإضافة أقساط');
      return;
    }

    const payments = [];
    const academicYear = '2024-2025';
    const semester = 'الفصل الأول 2024-2025';
    const now = new Date();

    for (const student of students) {
      const department = departments.find(d => d._id.toString() === student.department_id.toString());
      if (!department) continue;

      const installmentAmount = department.tuition_fee / 4;
      const startDate = new Date('2024-09-01');

      for (let i = 0; i < 4; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i * 3));

        // توزيع الحالات بشكل عشوائي
        let paidAmount = 0;
        let paymentDate = null;
        let status = 'pending';
        let paymentMethod = null;

        if (i === 0) {
          // الدفعة الأولى مدفوعة
          paidAmount = installmentAmount;
          paymentDate = new Date(startDate);
          status = 'paid';
          paymentMethod = 'نقد';
        } else if (i === 1) {
          // الدفعة الثانية جزئية
          paidAmount = installmentAmount / 2;
          paymentDate = new Date(dueDate);
          status = 'partial';
          paymentMethod = 'تحويل بنكي';
        } else if (i === 2 && Math.random() > 0.5) {
          // الدفعة الثالثة قد تكون مدفوعة
          paidAmount = installmentAmount;
          paymentDate = new Date(dueDate);
          status = 'paid';
          paymentMethod = 'شيك';
        }

        // التحقق من انتهاء الصلاحية
        if (status === 'pending' && dueDate < now) {
          status = 'overdue';
        }

        payments.push({
          student_id: student._id,
          department_id: department._id,
          amount: installmentAmount,
          paid_amount: paidAmount,
          remaining_amount: installmentAmount - paidAmount,
          due_date: dueDate,
          payment_date: paymentDate,
          status: status,
          semester: semester,
          academic_year: academicYear,
          installment_number: i + 1,
          type: 'رسوم دراسية',
          payment_method: paymentMethod,
          receipt_number: paymentDate ? `REC-${student.student_number}-${i + 1}` : null,
        });
      }
    }

    const createdPayments = await Payment.insertMany(payments);
    console.log(`✅ تم إضافة ${createdPayments.length} دفعة`);
    return createdPayments;
  } catch (error) {
    console.error('❌ Error seeding payments:', error);
    return [];
  }
};

// الدالة الرئيسية
const seedRealData = async () => {
  try {
    console.log('\n🚀 بدء إضافة البيانات الحقيقية...\n');

    // الحصول على الطلاب والأقسام الموجودة
    const students = await Student.find().populate('user_id');
    const departments = await Department.find();

    if (students.length === 0) {
      console.log('⚠️ لا توجد طلاب في قاعدة البيانات. يرجى تشغيل seed.js أولاً');
      return;
    }

    // إضافة الكتب
    await seedBooks();

    // إضافة الإشعارات
    await seedNotifications(students);

    // إضافة الأخبار والفعاليات
    await seedNews();

    // إضافة الأقساط
    await seedPayments(students, departments);

    console.log('\n✅ تم إضافة جميع البيانات بنجاح!\n');
  } catch (error) {
    console.error('❌ Error seeding real data:', error);
  }
};

// تشغيل الـ seed
const runSeed = async () => {
  await connectDB();
  await seedRealData();
  process.exit(0);
};

runSeed();

