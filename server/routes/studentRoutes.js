const express = require('express');
const router = express.Router();
const { addStudent, getStudentsByTutor } = require('../controllers/studentController');

// Route to add a student
router.post('/add', addStudent);

// Route to get list of students (We will need this for the dashboard later)
router.get('/:tutorId', getStudentsByTutor);

module.exports = router;