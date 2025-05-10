const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentName: String,
  studentNumber: String,
  studentGrade: {
    type : String,
    enum : ["1prep", "2prep", "3prep", "1high", "2high", "3high"],
  },
  studentCash: Number,
  boughtMonths: [{
    monthId: Number,
    name: String,
    grade: Number,
    price: Number,
    purchaseDate: {
      type: Date,
      default: Date.now
    }
  }],
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  },
  codeStatus: {
    type : Boolean,
    default : false,
  },
  activateDate: {
    type : Date,
    default : Date.now
  },
  watchedClasses: [String],
});

module.exports = mongoose.model("Student", studentSchema);
