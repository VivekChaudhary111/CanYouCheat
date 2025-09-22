const Exam = require('../models/Exam');
const User = require('../models/User');

// Create a new exam (instructors only)
exports.createExam = async (req, res) => {
  try {
    const { title, description, duration, startTime, endTime, questions, settings } = req.body;
    
    // Verify instructor role
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can create exams' });
    }

    const exam = new Exam({
      title,
      description,
      instructor: req.user.id,
      duration,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      questions: questions || [],
      settings: settings || {}
    });

    await exam.save();
    res.status(201).json({ message: 'Exam created successfully', exam });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all exams (for instructors) or enrolled exams (for students)
exports.getExams = async (req, res) => {
  try {
    let exams;
    
    if (req.user.role === 'instructor') {
      exams = await Exam.find({ instructor: req.user.id })
        .populate('instructor', 'name email')
        .populate('enrolledStudents', 'name email');
    } else {
      exams = await Exam.find({ enrolledStudents: req.user.id })
        .populate('instructor', 'name email');
    }

    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get exam by ID
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('enrolledStudents', 'name email');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if user has access to this exam
    const hasAccess = req.user.role === 'instructor' && exam.instructor._id.toString() === req.user.id ||
                     req.user.role === 'student' && exam.enrolledStudents.some(student => student._id.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enroll student in exam
exports.enrollStudent = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if student is already enrolled
    if (exam.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: 'Already enrolled in this exam' });
    }

    exam.enrolledStudents.push(studentId);
    await exam.save();

    res.json({ message: 'Successfully enrolled in exam' });
  } catch (error) {
    console.error('Error enrolling student:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update exam (instructors only)
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Verify instructor ownership
    if (exam.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ message: 'Exam updated successfully', exam: updatedExam });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete exam (instructors only)
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Verify instructor ownership
    if (exam.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};