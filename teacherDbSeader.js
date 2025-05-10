const mongoose = require('mongoose');
const { Student } = require('./models/Student');
const { Teacher, Month, Class } = require('./models/Teacher');
const ConnectToDB = require('./Config/db');

const seedDatabase = async () => {
  try {
    // Connect To DB
    await ConnectToDB();

    // Create New Months
    const months = await Month.insertMany([
      {
        monthId: 1,
        name: 'شهر مارس',
        grade: 1,
        price: 100
      },
      {
        monthId: 2,
        name: 'شهر ابريل',
        grade: 2,
        price: 100
      },
      {
        monthId: 3,
        name: 'شهر مايو',
        grade: 3,
        price: 120
      }
    ]);

    // Create A New Teacher
    const teacher = await Teacher.create({
      teacherID: 'TECH-001',
      teacherName: 'محمد ايمن',
      availableMonths: {
        '1': months[0]._id,
        '2': months[1]._id,
        '3': months[2]._id
      },
      availableClasses: []  // تأكد من أن المتغير متاح كمصفوفة
    });

    // Create A New Class
    const newClass = await Class.create({
      description: "شرح أساسيات الرياضيات",
      monthId: {
        "1": months[0]._id
      },
      title: "الدرس الأول في الرياضيات",
      videoId: "1",
      videoUrl: 'https://youtu.be/veAJjzwVkW4?si=1cB7x-7Z7jnXcfyk'
    });

    // تأكد من أن المتغير teacher.availableClasses يحتوي على مصفوفة
    if (!Array.isArray(teacher.availableClasses)) {
      teacher.availableClasses = [];  // إذا لم تكن مصفوفة، قم بإنشائها
    }

    // أضف الـ Class الجديد إلى Teacher
    teacher.availableClasses.push(newClass._id);

    // حفظ التغييرات
    await teacher.save();

    // Success Message
    console.log('The DB Has Been Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.log('Error In Seeding The DB');
    console.error(err);  // طباعة الخطأ بالكامل
    process.exit(1);
  }
};



seedDatabase();
