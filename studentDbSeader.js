const mongoose = require('mongoose');
const { Student } = require('./models/Student');  // Change the path as per your model location

async function seedDatabase() {
    const students = [
        {
            studentCode: '12345',
            studentName: 'Ahmed Ali',
            studentNumber: 112233,
            studentGrade: 2,
            studentCash: 1000,
            boughtMonths: new Map([
                [1, { monthId: 1, expiryDate: new Date('2025-12-31') }],
                [2, { monthId: 2, expiryDate: new Date('2026-01-31') }],
            ]),
            assignedTeacher: mongoose.Types.ObjectId(), // Generate new ObjectId
            expireDate: new Date('2026-12-31'),
            watchedClasses: new Map([
                [1, { classId: 1, watchedAt: new Date() }],
                [2, { classId: 2, watchedAt: new Date() }],
            ]),
        },
        {
            studentCode: '67890',
            studentName: 'Ali Mohammed',
            studentNumber: 445566,
            studentGrade: 3,
            studentCash: 1500,
            boughtMonths: new Map([
                [3, { monthId: 3, expiryDate: new Date('2026-12-31') }],
            ]),
            assignedTeacher: mongoose.Types.ObjectId(), // Generate new ObjectId
            expireDate: new Date('2027-01-31'),
            watchedClasses: new Map([
                [3, { classId: 3, watchedAt: new Date() }],
            ]),
        },
        process.exit(0)
        // Add more students here...
    ];

    try {
        // Remove _id if you don't need static IDs
        const cleanedStudents = students.map(student => {
            delete student._id;
            return student;
        });

        const insertedStudents = await Student.insertMany(cleanedStudents, { ordered: false });
        console.log('Students seeded successfully:', insertedStudents);
    } catch (error) {
        console.error('Error in seeding the DB:', error);
        process.exit(1);
    }
}

seedDatabase();
