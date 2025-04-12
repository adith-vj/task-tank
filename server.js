// server.js - Main entry point for TaskTank backend

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
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
app.use(express.static(__dirname));

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

// Generate subtasks using Groq
app.post('/api/generate-subtasks', async (req, res) => {
    const { taskTitle } = req.body;

    if (!apikey) {
        return res.status(400).json({ error: 'Invalid or missing API key' });
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apikey}`
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: [
                    {
                        role: "system",
                        content: "You are a task management assistant that breaks down tasks into specific, actionable subtasks. Always respond with a JSON array of exactly 4 strings."
                    },
                    {
                        role: "user",
                        content: `Break down the following task into exactly 4 specific, actionable subtasks. Make each subtask concrete, measurable, and unique to this task.

Task: "${taskTitle}"

Requirements:
1. Each subtask must be specific to this exact task
2. Subtasks must be in logical order of completion
3. Each subtask should represent about 25% of the total work
4. Avoid generic terms like "research" or "plan"
5. Include specific details relevant to this task
6. Make each subtask actionable and measurable

Format your response as a JSON array with exactly 4 strings, like this:
["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4"]`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        let subtasks = [];
        try {
            // Try to parse the response as JSON
            const jsonMatch = content.match(/\[.*\]/s);
            if (jsonMatch) {
                subtasks = JSON.parse(jsonMatch[0]);
            } else {
                // If not JSON, try to parse as text
                subtasks = content.split('\n')
                    .filter(line => line.trim().length > 0)
                    .map(line => line.replace(/^\d+\.\s*/, '').trim())
                    .slice(0, 4); // Take only first 4 lines
            }

            // Ensure we have exactly 4 subtasks
            if (subtasks.length !== 4) {
                throw new Error('Did not receive exactly 4 subtasks');
            }

            // Validate and clean each subtask
            subtasks = subtasks.map(task => {
                if (typeof task !== 'string') {
                    throw new Error('Invalid subtask format');
                }
                return task.trim();
            });

        } catch (e) {
            console.error("Failed to parse Groq response:", e);
            // Fallback to context-specific default subtasks
            const defaultSubtasks = {
                "report": [
                    "Gather and analyze relevant data sources",
                    "Create detailed outline with main sections",
                    "Write and refine content for each section",
                    "Proofread and format final document"
                ],
                "presentation": [
                    "Research and collect supporting materials",
                    "Design slide layout and visual elements",
                    "Create content for each slide",
                    "Practice and refine delivery"
                ],
                "project": [
                    "Define project scope and deliverables",
                    "Create implementation timeline",
                    "Execute core project components",
                    "Test and document results"
                ],
                "study": [
                    "Review course materials and notes",
                    "Create study guide with key concepts",
                    "Practice with sample questions",
                    "Review weak areas and final preparation"
                ],
                "meeting": [
                    "Prepare agenda and materials",
                    "Review previous meeting notes",
                    "Set up meeting space and technology",
                    "Document action items and follow-ups"
                ],
                "email": [
                    "Draft initial message content",
                    "Review and edit for clarity",
                    "Add attachments and formatting",
                    "Final proofread and send"
                ],
                "code": [
                    "Plan architecture and design",
                    "Implement core functionality",
                    "Add user interface elements",
                    "Test and debug code"
                ],
                "default": [
                    `Research and gather information about ${taskTitle}`,
                    `Create initial structure for ${taskTitle}`,
                    `Develop core components of ${taskTitle}`,
                    `Review and finalize ${taskTitle}`
                ]
            };

            // Determine which set of subtasks to use based on task title
            const lowerTitle = taskTitle.toLowerCase();
            if (lowerTitle.includes("report") || lowerTitle.includes("write up") || lowerTitle.includes("document")) {
                subtasks = defaultSubtasks.report;
            } else if (lowerTitle.includes("presentation") || lowerTitle.includes("slide") || lowerTitle.includes("pitch")) {
                subtasks = defaultSubtasks.presentation;
            } else if (lowerTitle.includes("project") || lowerTitle.includes("assignment") || lowerTitle.includes("task")) {
                subtasks = defaultSubtasks.project;
            } else if (lowerTitle.includes("study") || lowerTitle.includes("learn") || lowerTitle.includes("review")) {
                subtasks = defaultSubtasks.study;
            } else if (lowerTitle.includes("meeting") || lowerTitle.includes("call") || lowerTitle.includes("discussion")) {
                subtasks = defaultSubtasks.meeting;
            } else if (lowerTitle.includes("email") || lowerTitle.includes("message") || lowerTitle.includes("correspondence")) {
                subtasks = defaultSubtasks.email;
            } else if (lowerTitle.includes("code") || lowerTitle.includes("program") || lowerTitle.includes("develop")) {
                subtasks = defaultSubtasks.code;
            } else {
                subtasks = defaultSubtasks.default;
            }
        }

        res.json({
            subtasks: subtasks.map(title => ({
                id: uuidv4(),
                title,
                completed: false
            }))
        });
    } catch (error) {
        console.error("Error generating subtasks:", error);
        res.status(500).json({
            error: 'Failed to generate subtasks',
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
