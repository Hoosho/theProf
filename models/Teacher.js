const mongoose = require('mongoose');

// Create Month Schema

const monthSchema = new mongoose.Schema({
    id: Number,
    name: String,
    grade: Number,
    pricOfMonth: Number,
}, { timestamps: true });



// Create Class Schema
const classSchema = new mongoose.Schema({
    id: Number,
    title: String,
    description: String,
    grade: Number,
    monthId: Number,
    url: String,
    pdf: String,
    exams: String,
  });

// Create Teacher Schema
const teacherSchema = new mongoose.Schema({
    teacherName: { 
        type: String, 
        required: true 

    },
    teacherNumber: { 
        type: String, 
        required: true 

    },
    availableMonths: { 
        type: [monthSchema], 
        default: [] 

    },
    availableClasses: { 
        type: [classSchema], 
        default: [] 

    }
  });
  
  
// Export The Models
module.exports = mongoose.model("Teacher", teacherSchema);