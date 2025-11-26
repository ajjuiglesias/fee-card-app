const express = require('express');
const router = express.Router();
const { addStudent, getStudentsByTutor, deleteStudent } = require('../controllers/studentController');

// Route to add a student
router.post('/add', addStudent);

// Route to get list of students
router.get('/:tutorId', getStudentsByTutor);

// Route to delete a student
router.delete('/:id', deleteStudent);

module.exports = router;