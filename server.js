// server.js - Main entry point for TaskTank backend

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const apikey = process.env.API; 
// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'tt')));

// Debug Logger
app.use((req, res, next) => {
    console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
    next();
    });


// In-memory data store
let tasks = [];
let completedTasks = [];
let wreckageTasks = [];

// Initialize Gemini API
let genAI = null;

function initializeGenAI(apiKey) {
    if (!apiKey) return false;

    try {
    genAI = new GoogleGenerativeAI(apiKey);
    return true;
    } catch (error) {
    console.error("Failed to initialize Gemini API:", error);
    return false;
    }
}

// New route to handle `/api/tasks`
app.get('/api/tasks', (req, res) => {
    res.json({
    tasks,
    completedTasks,
    wreckageTasks
    });
});

// Existing dynamic route (still used)
app.get('/api/tasks/:id', (req, res) => {
    res.json({
    tasks,
    completedTasks,
    wreckageTasks
    });
});

// Add a new task
app.post('/api/tasks', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Task title is required' });

    const newTask = {
    id: uuidv4(),
    title,
    createdAt: new Date(),
    subtasks: []
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

    const [removedTask] = tasks.splice(taskIndex, 1);
    res.json(removedTask);
});

// Move task to wreckage pile
app.post('/api/tasks/:id/surrender', (req, res) => {
    const taskId = req.params.id;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

    const [removedTask] = tasks.splice(taskIndex, 1);
    wreckageTasks.push(removedTask);
    res.json(removedTask);
});

// Complete a task
app.post('/api/tasks/:id/complete', (req, res) => {
    const taskId = req.params.id;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return res.status(404).json({ error: 'Task not found' });

    const [completedTask] = tasks.splice(taskIndex, 1);
    completedTask.completedAt = new Date();
    completedTasks.push(completedTask);
    res.json(completedTask);
});

// Salvage task from wreckage
app.post('/api/wreckage/:id/salvage', (req, res) => {
    const taskId = req.params.id;
    const taskIndex = wreckageTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return res.status(404).json({ error: 'Task not found in wreckage' });

    const [salvageTask] = wreckageTasks.splice(taskIndex, 1);
    tasks.push(salvageTask);
    res.json(salvageTask);
});

// Generate subtasks using Gemini
app.post('/api/tasks/:id/generate-subtasks', async (req, res) => {
    const { apiKey } = req.body;
    const taskId = req.params.id;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (!genAI && !initializeGenAI(apiKey)) {
        return res.status(400).json({ error: 'Invalid or missing API key' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
        Break down the following task into 3-5 clear, actionable subtasks:
        Task: "${task.title}"
        
        Please provide only the list of subtasks, with each subtask being specific and achievable.
        Format the response as a JSON array with each subtask as a string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let subtasks = [];
    try {
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
        subtasks = JSON.parse(jsonMatch[0]);
        } else {
            subtasks = text.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.replace(/^\d+\.\s*/, '').trim());
        }
    } catch (e) {
        console.error("Failed to parse Gemini response:", e);
        subtasks = ["Break down task", "Work on components", "Review and finalize"];
    }

    task.subtasks = subtasks.map(title => ({
        id: uuidv4(),
        title,
        completed: false
    }));

    res.json(task);
    } catch (error) {
        console.error("Error generating subtasks:", error);
        res.status(500).json({
        error: 'Failed to generate subtasks', // fixed typo here
        details: error.message
        });
    }
    });

// Update subtask status
app.patch('/api/tasks/:taskId/subtasks/:subtaskId', (req, res) => {
    const { taskId, subtaskId } = req.params;
    const { completed } = req.body;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    subtask.completed = completed;
    res.json(subtask);
});

// Set Gemini API key
app.post('/api/settings/gemini-key', (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key is required' });

    const success = initializeGenAI(apiKey);

    if (success) {
        res.json({ success: true, message: 'API key set successfully' });
    } else {
        res.status(400).json({ error: 'Invalid API key' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Start the server
    app.listen(PORT, () => {
    console.log(`TaskTank server running on port ${PORT}`);
});
