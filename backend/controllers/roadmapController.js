import fs from 'fs';
import pdf from 'pdf-parse';
import { parseOffice } from 'officeparser';
import geminiService from '../services/geminiService.js';
import Roadmap from '../models/Roadmap.js';

/**
 * @desc    Generate a syllabus deconstructed roadmap
 * @route   POST /api/roadmaps/generate
 * @access  Private
 */
export const generateRoadmap = async (req, res) => {
  let syllabusText = '';
  let filePath = '';
  const { timeframe, text } = req.body;

  try {
    // 1. Process files if uploaded via Multer
    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      filePath = file.path;
      const fileExtension = file.originalname.split('.').pop().toLowerCase();

      if (fileExtension === 'pdf') {
        const fileBuffer = fs.readFileSync(file.path);
        const pdfData = await pdf(fileBuffer);
        syllabusText = pdfData.text;
      } else if (fileExtension === 'txt') {
        syllabusText = fs.readFileSync(file.path, 'utf8');
      } else if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'rtf', 'md', 'html', 'csv'].includes(fileExtension)) {
        const ast = await parseOffice(file.path);
        const parseResult = await ast.to('text');
        syllabusText = parseResult && typeof parseResult === 'object' ? parseResult.value : parseResult;
      }
    } else if (text) {
      // Fallback copy-paste text
      syllabusText = text;
    }

    if (!syllabusText || !syllabusText.trim()) {
      return res.status(400).json({ success: false, error: 'Please upload a syllabus file or paste syllabus text' });
    }

    // 2. Call Gemini API to deconstruct syllabus and partition timeline modules
    const roadmapData = await geminiService.deconstructSyllabus(syllabusText, timeframe || 'Self-Paced');

    // 3. Save roadmap to Database
    const newRoadmap = await Roadmap.create({
      userId: req.user.id,
      title: roadmapData.title || 'Syllabus Study Roadmap',
      timeframe: timeframe || 'Self-Paced',
      modules: roadmapData.modules.map(mod => ({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        duration: mod.duration,
        completed: false,
        tasks: mod.tasks.map(task => ({
          id: task.id,
          name: task.name,
          completed: false
        }))
      })),
      progress: 0
    });

    res.status(201).json({
      success: true,
      roadmap: newRoadmap
    });
  } catch (error) {
    console.error('Generate Roadmap Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Clean up temporary uploads directory file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to remove temp uploaded file:', err);
      }
    }
  }
};

/**
 * @desc    Get all roadmaps for the logged-in user
 * @route   GET /api/roadmaps/history
 * @access  Private
 */
export const getUserRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user.id })
      .select('title timeframe progress createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      roadmaps
    });
  } catch (error) {
    console.error('Get User Roadmaps Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get a specific roadmap detail by ID
 * @route   GET /api/roadmaps/:id
 * @access  Private
 */
export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found' });
    }

    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to view this roadmap' });
    }

    res.status(200).json({
      success: true,
      roadmap
    });
  } catch (error) {
    console.error('Get Roadmap By ID Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Toggle completion status of a specific task in a module
 * @route   PUT /api/roadmaps/:id/task
 * @access  Private
 */
export const toggleRoadmapTask = async (req, res) => {
  const { moduleId, taskId, completed } = req.body;

  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found' });
    }

    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to modify this roadmap' });
    }

    let totalTasksCount = 0;
    let completedTasksCount = 0;

    roadmap.modules = roadmap.modules.map((mod) => {
      if (mod.id === Number(moduleId)) {
        mod.tasks = mod.tasks.map((task) => {
          if (task.id === Number(taskId)) {
            task.completed = completed;
          }
          return task;
        });

        // Set module completed status if all tasks are complete
        mod.completed = mod.tasks.every(t => t.completed);
      }

      totalTasksCount += mod.tasks.length;
      completedTasksCount += mod.tasks.filter(t => t.completed).length;

      return mod;
    });

    // Update total roadmap progress percentage
    roadmap.progress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
    await roadmap.save();

    res.status(200).json({
      success: true,
      roadmap
    });
  } catch (error) {
    console.error('Toggle Task Progress Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete a roadmap
 * @route   DELETE /api/roadmaps/:id
 * @access  Private
 */
export const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ success: false, error: 'Roadmap not found' });
    }

    if (roadmap.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this roadmap' });
    }

    await Roadmap.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Roadmap deleted successfully'
    });
  } catch (error) {
    console.error('Delete Roadmap Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
