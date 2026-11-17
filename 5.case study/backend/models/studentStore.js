const mongoose = require('mongoose');

// Define Mongoose Schema for MongoDB Atlas
const studentSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      default: 4,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.5,
    },
  },
  { timestamps: true }
);

let StudentModel = null;
try {
  StudentModel = mongoose.model('Student', studentSchema);
} catch (e) {
  StudentModel = mongoose.model('Student');
}

// In-Memory Seed Data for immediate offline/local demonstration
let inMemoryStudents = [
  {
    _id: '6651a2b4c59d1e3456789001',
    rollNo: 'A24126552067',
    name: 'Rahul Sharma',
    department: 'CSE',
    email: 'rahul.sharma@college.edu',
    semester: 4,
    cgpa: 8.92,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6651a2b4c59d1e3456789002',
    rollNo: 'A24126552068',
    name: 'Ananya Iyer',
    department: 'IT',
    email: 'ananya.iyer@college.edu',
    semester: 4,
    cgpa: 9.35,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6651a2b4c59d1e3456789003',
    rollNo: 'A24126552069',
    name: 'Aditya Varma',
    department: 'ECE',
    email: 'aditya.varma@college.edu',
    semester: 4,
    cgpa: 8.41,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6651a2b4c59d1e3456789004',
    rollNo: 'A24126552070',
    name: 'Sneha Patel',
    department: 'CSE',
    email: 'sneha.patel@college.edu',
    semester: 4,
    cgpa: 9.1,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '6651a2b4c59d1e3456789005',
    rollNo: 'A24126552071',
    name: 'Karthik Reddy',
    department: 'AIDS',
    email: 'karthik.reddy@college.edu',
    semester: 4,
    cgpa: 8.78,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Unified Student Store: Uses MongoDB Atlas if connected, else In-Memory store
class StudentStore {
  static isMongoConnected() {
    return mongoose.connection.readyState === 1;
  }

  static async getAll() {
    if (this.isMongoConnected()) {
      return await StudentModel.find().sort({ rollNo: 1 });
    }
    return inMemoryStudents;
  }

  static async getById(id) {
    if (this.isMongoConnected()) {
      return await StudentModel.findById(id);
    }
    return inMemoryStudents.find((s) => s._id === id);
  }

  static async create(data) {
    if (this.isMongoConnected()) {
      const student = new StudentModel(data);
      return await student.save();
    }
    const newStudent = {
      _id: 'mem_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...data,
      rollNo: data.rollNo.toUpperCase().trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryStudents.unshift(newStudent);
    return newStudent;
  }

  static async update(id, updateData) {
    if (this.isMongoConnected()) {
      return await StudentModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    }
    const index = inMemoryStudents.findIndex((s) => s._id === id);
    if (index === -1) return null;
    inMemoryStudents[index] = {
      ...inMemoryStudents[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };
    return inMemoryStudents[index];
  }

  static async delete(id) {
    if (this.isMongoConnected()) {
      return await StudentModel.findByIdAndDelete(id);
    }
    const index = inMemoryStudents.findIndex((s) => s._id === id);
    if (index === -1) return null;
    const deleted = inMemoryStudents.splice(index, 1);
    return deleted[0];
  }
}

module.exports = { StudentStore, StudentModel };
