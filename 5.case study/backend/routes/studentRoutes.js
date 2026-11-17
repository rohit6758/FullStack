const express = require('express');
const router = express.Router();
const { StudentStore } = require('../models/studentStore');

// GET /api/students - Retrieve all student records
router.get('/', async (req, res) => {
  try {
    const students = await StudentStore.getAll();
    res.status(200).json({
      success: true,
      count: students.length,
      dataSource: StudentStore.isMongoConnected() ? 'MongoDB Atlas' : 'In-Memory Store (Seed Demo)',
      data: students,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/students/:id - Retrieve single student record
router.get('/:id', async (req, res) => {
  try {
    const student = await StudentStore.getById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/students - Create a new student record
router.post('/', async (req, res) => {
  try {
    const { rollNo, name, department, email, semester, cgpa } = req.body;

    if (!rollNo || !name || !department || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: rollNo, name, department, email',
      });
    }

    // Check duplicate rollNo
    const existing = await StudentStore.getAll();
    const isDuplicate = existing.some(
      (s) => s.rollNo.toUpperCase() === rollNo.toUpperCase() || s.email.toLowerCase() === email.toLowerCase()
    );
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'A student with this Roll Number or Email already exists.',
      });
    }

    const createdStudent = await StudentStore.create({
      rollNo,
      name,
      department,
      email,
      semester: Number(semester) || 1,
      cgpa: Number(cgpa) || 8.0,
    });

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: createdStudent,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/students/:id - Update student record
router.put('/:id', async (req, res) => {
  try {
    const updated = await StudentStore.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Student not found to update' });
    }
    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: updated,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/students/:id - Delete student record
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await StudentStore.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student not found to delete' });
    }
    res.status(200).json({
      success: true,
      message: `Student record deleted successfully`,
      data: deleted,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
