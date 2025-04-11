// index.js - Enhanced with subtask functionality and Gemini integration

document.addEventListener('DOMContentLoaded', function() {
    // API URL - Change to your server URL in production
    const API_URL = 'http://localhost:3000/api';
    
    // State management
    let geminiApiKey = localStorage.getItem('geminiApiKey') || '';
    let currentTaskInTankLock = null;
    
    // Get elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const tankLockMode = document.getElementById('tank-lock-mode');
    const exitLockBtn = document.getElementById('exit-lock-btn');
    const completeBtn = document.getElementById('complete-btn');
    const surrenderBtn = document.getElementById('surrender-btn');
    const explosionContainer = document.getElementById('explosion-container');
    const soundIndicator = document.getElementById('sound-indicator');
    const toggleSoundBtn = document.getElementById('toggle-sound-btn');
    const showStatsBtn = document.getElementById('show-stats-btn');
    
    // Demo commands array
    const tankCommands = [
        "MOVE IT, PRIVATE! THIS TASK ISN'T GOING TO COMPLETE ITSELF!",
        "DO YOU WANT TO BE A PROCRASTINATOR FOREVER? FOCUS UP!",
        "I'VE SEEN SNAILS MOVE FASTER THAN YOUR PROGRESS! GET MOVING!",
        "THAT DEADLINE IS APPROACHING LIKE A MISSILE! HUSTLE!",
        "IS THIS YOUR BEST EFFORT? MY GRANDMOTHER WORKS HARDER!",
        "EYES ON THE TARGET, SOLDIER! DISTRACTIONS ARE FOR THE WEAK!",
        "THIS ISN'T NAPTIME! ENGAGE THAT BRAIN AND FINISH THE MISSION!"
    ];
    
    const notificationMessages = [
        "Stay focused, soldier!",
        "You're doing great, keep it up!",
        "Don't let distractions win!",
        "Keep pushing, you're almost there!",
        "Your task depends on your determination!"
    ];
    
    // Sound setting
    let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    toggleSoundBtn.textContent = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    
    // Load tasks from API
    async function loadTasks() {
        try {
            const response = await fetch(`${API_URL}/tasks`);
            const data = await response.json();
            
            // Clear current tasks
            taskList.innerHTML = '';
            
            // Render active tasks
            data.tasks.forEach(task => {
                addTaskToUI(task);
            });
            
            // Render wreckage tasks
            const wreckageItems = document.querySelector('.wreckage-items');
            wreckageItems.innerHTML = '';
            
            data.wreckageTasks.forEach(task => {
                const wreckageItem = document.createElement('div');
                wreckageItem.className = 'wreckage-item';
                wreckageItem.dataset.taskId = task.id;
                wreckageItem.innerHTML = `
                    <span class="wreckage-task-title">${task.title}</span>
                    <button class="reclaim-btn">SALVAGE</button>
                `;
                wreckageItems.appendChild(wreckageItem);
            });
            
            // Add event listeners to salvage buttons
            document.querySelectorAll('.reclaim-btn').forEach(btn => {
                btn.addEventListener('click', handleSalvageTask);
            });
            
        } catch (error) {
            console.error('Failed to load tasks:', error);
            showNotification('Failed to load tasks. Please try again.');
        }
    }
    
    // Add new task to UI
    function addTaskToUI(task) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.dataset.taskId = task.id;
        
        taskItem.innerHTML = `
            <div class="task-content">
                <span class="task-title">${task.title}</span>
                ${task.subtasks && task.subtasks.length > 0 ? 
                    `<span class="subtask-badge">${task.subtasks.length} subtasks</span>` : ''}
            </div>
            <div class="task-actions">
                <button class="task-btn tank-lock-btn">TANK LOCK</button>
                <button class="task-btn destroy-btn">DESTROY</button>
            </div>
        `;
        
        // Add event listeners
        taskItem.querySelector('.tank-lock-btn').addEventListener('click', () => {
            enterTankLock(task);
        });
        
        taskItem.querySelector('.destroy-btn').addEventListener('click', () => {
            destroyTask(task.id);
        });
        
        taskList.prepend(taskItem);
    }
    
    // Add new task
    async function addNewTask(title) {
        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });
            
            const task = await response.json();
            addTaskToUI(task);
            return task;
            
        } catch (error) {
            console.error('Failed to add task:', error);
            showNotification('Failed to add task. Please try again.');
        }
    }
    
    // Generate subtasks using Gemini
    async function generateSubtasks(taskId) {
        try {
            if (!geminiApiKey) {
                promptForGeminiKey();
                return;
            }
            
            showNotification('Generating subtasks...');
            
            const response = await fetch(`${API_URL}/tasks/${taskId}/generate-subtasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey: geminiApiKey })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate subtasks');
            }
            
            const task = await response.json();
            return task;
            
        } catch (error) {
            console.error('Failed to generate subtasks:', error);
            showNotification('Failed to generate subtasks: ' + error.message);
            return null;
        }
    }
    
    // Prompt for Gemini API key
    function promptForGeminiKey() {
        const apiKey = prompt('Please enter your Gemini API key to enable subtask generation:');
        if (apiKey) {
            // Save API key to localStorage
            localStorage.setItem('geminiApiKey', apiKey);
            geminiApiKey = apiKey;
            
            // Validate key with server
            fetch(`${API_URL}/settings/gemini-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ apiKey })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showNotification('Gemini API key set successfully!');
                } else {
                    showNotification('Invalid API key. Please try again.');
                }
            })
            .catch(error => {
                console.error('Failed to set API key:', error);
                showNotification('Failed to set API key. Please try again.');
            });
        }
    }
    
    // Enter Tank Lock mode
    async function enterTankLock(task) {
        currentTaskInTankLock = task;
        
        // If no subtasks exist, generate them
        if (!task.subtasks || task.subtasks.length === 0) {
            const updatedTask = await generateSubtasks(task.id);
            if (updatedTask) {
                currentTaskInTankLock = updatedTask;
            }
        }
        
        // Update focused task title
        document.querySelector('.focused-task-title').textContent = task.title;
        
        // Show subtasks if they exist
        const subtasksContainer = document.getElementById('subtasks-container') || document.createElement('div');
        subtasksContainer.id = 'subtasks-container';
        subtasksContainer.className = 'subtasks-container';
        
        if (currentTaskInTankLock.subtasks && currentTaskInTankLock.subtasks.length > 0) {
            subtasksContainer.innerHTML = `
                <h3>MISSION OBJECTIVES</h3>
                <div class="subtasks-list">
                    ${currentTaskInTankLock.subtasks.map(subtask => `
                        <div class="subtask-item" data-subtask-id="${subtask.id}">
                            <input type="checkbox" id="subtask-${subtask.id}" ${subtask.completed ? 'checked' : ''}>
                            <label for="subtask-${subtask.id}">${subtask.title}</label>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            subtasksContainer.innerHTML = `
                <h3>MISSION OBJECTIVES</h3>
                <div class="no-subtasks">
                    <p>No subtasks available. Focus on the main objective!</p>
                </div>
            `;
        }
        
        // Add subtasks container to focused task
        const focusedTask = document.querySelector('.focused-task');
        const existingSubtasks = focusedTask.querySelector('#subtasks-container');
        if (existingSubtasks) {
            focusedTask.replaceChild(subtasksContainer, existingSubtasks);
        } else {
            focusedTask.insertBefore(subtasksContainer, focusedTask.querySelector('.task-controls'));
        }
        
        // Add event listeners to subtask checkboxes
        subtasksContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', handleSubtaskChange);
        });
        
        // Show random timer (between 10-20 minutes)
        let minutes = Math.floor(Math.random() * 10) + 10;
        let seconds = Math.floor(Math.random() * 60);
        
        const timerElement = document.getElementById('countdown-timer');
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Show Tank Lock mode
        tankLockMode.classList.add('tank-lock-active');
        
        // Open in new window if requested
        const shouldOpenNewWindow = true; // Make this configurable
        if (shouldOpenNewWindow) {
            // Create a simplified version of the Tank Lock mode in a new window
            const newWindow = window.open('', 'TaskTankFocus', 'width=800,height=600');
            
            if (newWindow) {
                // Generate HTML for the new window
                const focusHTML = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>TaskTank - Focus Mode</title>
                    <style>
                        ${document.querySelector('style') ? document.querySelector('style').textContent : ''}
                        
                        body {
                            background-color: #0a0a0a;
                            color: #d3ffce;
                            font-family: 'Courier New', monospace;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            flex-direction: column;
                            height: 100vh;
                        }
                        
                        .tank-lock-header {
                            background-color: #1a2a18;
                            padding: 15px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 3px solid #3a5a36;
                        }
                        
                        .focused-task {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 20px;
                        }
                        
                        .focused-task-title {
                            font-size: 2rem;
                            margin-bottom: 20px;
                            color: #d3ffce;
                            text-transform: uppercase;
                        }
                        
                        .countdown-timer {
                            font-size: 5rem;
                            font-weight: bold;
                            margin: 30px 0;
                            color: #90ee90;
                            text-shadow: 0 0 10px rgba(144, 238, 144, 0.5);
                        }
                        
                        .subtasks-container {
                            width: 100%;
                            max-width: 600px;
                            margin: 20px 0;
                            padding: 20px;
                            background-color: #1a2a18;
                            border-radius: 10px;
                        }
                        
                        .subtask-item {
                            margin: 10px 0;
                            padding: 10px;
                            background-color: #0a0a0a;
                            border-radius: 5px;
                        }
                        
                        .task-controls {
                            display: flex;
                            gap: 20px;
                            margin-top: 30px;
                        }
                        
                        .complete-btn, .surrender-btn {
                            padding: 15px 30px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                            text-transform: uppercase;
                        }
                        
                        .complete-btn {
                            background-color: #90ee90;
                            color: #0a0a0a;
                        }
                        
                        .surrender-btn {
                            background-color: #5a3a30;
                            color: #d3ffce;
                        }
                    </style>
                </head>
                <body>
                    <div class="tank-lock-header">
                        <div class="tank-lock-title">TANK LOCK ENGAGED</div>
                        <div class="timer-display" id="focus-timer">${timerElement.textContent}</div>
                    </div>
                    
                    <div class="focused-task">
                        <h2 class="focused-task-title">${task.title}</h2>
                        
                        ${subtasksContainer.outerHTML}
                        
                        <div class="commander-message">
                            FOCUS, SOLDIER! THIS TASK WON'T COMPLETE ITSELF!
                        </div>
                        
                        <div class="task-controls">
                            <button class="complete-btn" id="focus-complete-btn">MISSION COMPLETE</button>
                            <button class="surrender-btn" id="focus-surrender-btn">SURRENDER</button>
                        </div>
                    </div>
                    
                    <script>
                        // Timer functionality
                        let minutes = ${minutes};
                        let seconds = ${seconds};
                        const timerElement = document.getElementById('focus-timer');
                        
                        const countdown = setInterval(() => {
                            if (seconds === 0) {
                                if (minutes === 0) {
                                    clearInterval(countdown);
                                    timerElement.textContent = "00:00";
                                    alert("Time's up! Task completed!");
                                    window.close();
                                    return;
                                }
                                minutes--;
                                seconds = 59;
                            } else {
                                seconds--;
                            }
                            
                            timerElement.textContent = \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
                        }, 1000);
                        
                        // Button event listeners
                        document.getElementById('focus-complete-btn').addEventListener('click', () => {
                            clearInterval(countdown);
                            window.opener.postMessage({ action: 'complete', taskId: '${task.id}' }, '*');
                            window.close();
                        });
                        
                        document.getElementById('focus-surrender-btn').addEventListener('click', () => {
                            clearInterval(countdown);
                            window.opener.postMessage({ action: 'surrender', taskId: '${task.id}' }, '*');
                            window.close();
                        });
                        
                        // Handle subtask checkbox changes
                        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                            checkbox.addEventListener('change', function() {
                                const subtaskId = this.closest('.subtask-item').dataset.subtaskId;
                                window.opener.postMessage({
                                    action: 'updateSubtask',
                                    taskId: '${task.id}',
                                    subtaskId: subtaskId,
                                    completed: this.checked
                                }, '*');
                            });
                        });
                        
                        // Listen for messages from opener
                        window.addEventListener('message', function(event) {
                            if (event.data.action === 'updateSubtasks') {
                                const subtasks = event.data.subtasks;
                                subtasks.forEach(subtask => {
                                    const checkbox = document.querySelector(\`input#subtask-\${subtask.id}\`);
                                    if (checkbox) {
                                        checkbox.checked = subtask.completed;
                                    }
                                });
                            }
                        });
                    </script>
                </body>
                </html>
                `;
                
                newWindow.document.write(focusHTML);
                newWindow.document.close();
                
                // Listen for messages from the new window
                window.addEventListener('message', async function(event) {
                    if (event.data.action === 'complete') {
                        await completeTask(currentTaskInTankLock.id);
                        tankLockMode.classList.remove('tank-lock-active');
                    } else if (event.data.action === 'surrender') {
                        await surrenderTask(currentTaskInTankLock.id);
                        tankLockMode.classList.remove('tank-lock-active');
                    } else if (event.data.action === 'updateSubtask') {
                        await updateSubtaskStatus(
                            event.data.taskId,
                            event.data.subtaskId,
                            event.data.completed
                        );
                    }
                });
            } else {
                showNotification('Popup blocked! Enable popups to use focus mode.');
            }
        }

        // Create countdown timer
        let countdown = setInterval(() => {
            if (seconds === 0) {
                if (minutes === 0) {
                    clearInterval(countdown);
                    timerElement.textContent = "00:00";
                    alert("Time's up! Tank Lock mode complete!");
                    return;
                }
                minutes--;
                seconds = 59;
            } else {
                seconds--;
            }
            
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (Math.random() < 0.2) {
                showNotification(notificationMessages[Math.floor(Math.random() * notificationMessages.length)]);
            }
        }, 1000);
        
        // Store countdown interval to clear later
        tankLockMode.dataset.countdownInterval = countdown;
        
        // Play random command
        if (soundEnabled) {
            const randomCommand = tankCommands[Math.floor(Math.random() * tankCommands.length)];
            soundIndicator.textContent = randomCommand;
            soundIndicator.style.display = 'block';
            
            // Update commander message in Tank Lock mode
            document.querySelector('.commander-message').textContent = randomCommand;
            
            // Hide sound indicator after animation
            setTimeout(() => {
                soundIndicator.style.display = 'none';
            }, 3000);
        }
    }
    
    // Update subtask status
    async function updateSubtaskStatus(taskId, subtaskId, completed) {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/subtasks/${subtaskId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });
            
            const updatedSubtask = await response.json();
            
            // Update local state
            if (currentTaskInTankLock && currentTaskInTankLock.id === taskId) {
                const subtask = currentTaskInTankLock.subtasks.find(st => st.id === subtaskId);
                if (subtask) {
                    subtask.completed = completed;
                }
            }
            
            return updatedSubtask;
            
        } catch (error) {
            console.error('Failed to update subtask:', error);
            showNotification('Failed to update subtask');
        }
    }
    
    // Handle subtask checkbox changes
    async function handleSubtaskChange(event) {
        const checkbox = event.target;
        const subtaskItem = checkbox.closest('.subtask-item');
        const subtaskId = subtaskItem.dataset.subtaskId;
        
        await updateSubtaskStatus(
            currentTaskInTankLock.id,
            subtaskId,
            checkbox.checked
        );
    }
    
    // Complete task
    async function completeTask(taskId) {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const completedTask = await response.json();
            
            // Show explosion animation
            explosionContainer.style.display = 'flex';
            
            // Play completion sound
            if (soundEnabled) {
                soundIndicator.textContent = "OUTSTANDING! MISSION ACCOMPLISHED!";
                soundIndicator.style.display = 'block';
                
                setTimeout(() => {
                    soundIndicator.style.display = 'none';
                }, 3000);
            }
            
            // Hide explosion and reload tasks
            setTimeout(() => {
                explosionContainer.style.display = 'none';
                loadTasks();
                
                // Clear countdown interval
                const countdownInterval = parseInt(tankLockMode.dataset.countdownInterval);
                if (!isNaN(countdownInterval)) {
                    clearInterval(countdownInterval);
                }
                
                tankLockMode.classList.remove('tank-lock-active');
            }, 1000);
            
            return completedTask;
            
        } catch (error) {
            console.error('Failed to complete task:', error);
            showNotification('Failed to complete task');
        }
        // Surrender task
    async function surrenderTask(taskId) {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/surrender`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const task = await response.json();
            
            // Clear countdown interval
            const countdownInterval = parseInt(tankLockMode.dataset.countdownInterval);
            if (!isNaN(countdownInterval)) {
                clearInterval(countdownInterval);
            }
            
            // Play failure sound
            if (soundEnabled) {
                soundIndicator.textContent = "PATHETIC! ANOTHER MISSION FAILED!";
                soundIndicator.style.display = 'block';
                
                setTimeout(() => {
                    soundIndicator.style.display = 'none';
                }, 3000);
            }
            
            // Reload tasks
            loadTasks();
            
            return task;
            
        } catch (error) {
            console.error('Failed to surrender task:', error);
            showNotification('Failed to surrender task');
        }
    }
    
    // Destroy task
    async function destroyTask(taskId) {
        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'DELETE'
            });
            
            const task = await response.json();
            
            // Show explosion animation
            explosionContainer.style.display = 'flex';
            
            // Play destruction sound
            if (soundEnabled) {
                soundIndicator.textContent = "TARGET DESTROYED! EXCELLENT WORK, SOLDIER!";
                soundIndicator.style.display = 'block';
                
                setTimeout(() => {
                    soundIndicator.style.display = 'none';
                }, 3000);
            }
            
            // Hide explosion and reload tasks
            setTimeout(() => {
                explosionContainer.style.display = 'none';
                loadTasks();
            }, 1000);
            
            return task;
            
        } catch (error) {
            console.error('Failed to destroy task:', error);
            showNotification('Failed to destroy task');
        }
    }
    }
    // Salvage task from wreckage
    async function handleSalvageTask(event) {
        const wreckageItem = event.target.closest('.wreckage-item');
        const taskId = wreckageItem.dataset.taskId;
        
        try {
            const response = await fetch(`${API_URL}/wreckage/${taskId}/salvage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const task = await response.json();
            
            // Reload tasks
            loadTasks();
            
            if (soundEnabled) {
                soundIndicator.textContent = "SALVAGE OPERATION COMPLETE! BACK TO WORK, SOLDIER!";
                soundIndicator.style.display = 'block';
                
                setTimeout(() => {
                    soundIndicator.style.display = 'none';
                }, 3000);
            }
            
            return task;
            
        } catch (error) {
            console.error('Failed to salvage task:', error);
            showNotification('Failed to salvage task');
        }
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Force reflow to ensure the transition works
        notification.offsetHeight;
        
        notification.style.opacity = 1;
        
        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
    
    // Mission stats modal
    function showMissionStats() {
        // Create modal element
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Fetch current task data
        fetch(`${API_URL}/tasks`)
            .then(response => response.json())
            .then(data => {
                const activeCount = data.tasks.length;
                const completedCount = data.completedTasks.length;
                const wreckageCount = data.wreckageTasks.length;
                const totalCount = activeCount + completedCount + wreckageCount;
                const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                
                // Calculate subtask completion
                let totalSubtasks = 0;
                let completedSubtasks = 0;
                
                data.tasks.forEach(task => {
                    if (task.subtasks && task.subtasks.length > 0) {
                        totalSubtasks += task.subtasks.length;
                        completedSubtasks += task.subtasks.filter(st => st.completed).length;
                    }
                });
                
                // Create modal content
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>MISSION STATISTICS</h2>
                            <button class="close-modal">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <div class="stat-value">${activeCount}</div>
                                    <div class="stat-label">ACTIVE MISSIONS</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${completedCount}</div>
                                    <div class="stat-label">COMPLETED MISSIONS</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${wreckageCount}</div>
                                    <div class="stat-label">FAILED MISSIONS</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">${successRate}%</div>
                                    <div class="stat-label">SUCCESS RATE</div>
                                </div>
                            </div>
                            
                            <div class="subtask-stats">
                                <h3>OBJECTIVES COMPLETION</h3>
                                <div class="progress-container">
                                    <div class="progress-bar" style="width: ${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%"></div>
                                </div>
                                <div class="progress-label">
                                    ${completedSubtasks}/${totalSubtasks} SUBTASKS COMPLETED
                                </div>
                            </div>
                            
                            <div class="gemini-settings">
                                <h3>GEMINI AI CONFIGURATION</h3>
                                <div class="api-key-container">
                                    <input type="password" id="gemini-api-key" placeholder="Enter Gemini API Key" value="${geminiApiKey || ''}">
                                    <button id="save-api-key">SAVE</button>
                                </div>
                                <div class="gemini-status">
                                    STATUS: ${geminiApiKey ? 'CONNECTED' : 'DISCONNECTED'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add to document
                document.body.appendChild(modal);
                
                // Show modal with animation
                setTimeout(() => {
                    modal.classList.add('show');
                }, 10);
                
                // Close button functionality
                modal.querySelector('.close-modal').addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                    }, 300);
                });
                
                // Save API key functionality
                modal.querySelector('#save-api-key').addEventListener('click', () => {
                    const apiKey = modal.querySelector('#gemini-api-key').value;
                    if (apiKey) {
                        localStorage.setItem('geminiApiKey', apiKey);
                        geminiApiKey = apiKey;
                        
                        // Validate key with server
                        fetch(`${API_URL}/settings/gemini-key`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ apiKey })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                modal.querySelector('.gemini-status').textContent = 'STATUS: CONNECTED';
                                showNotification('Gemini API key set successfully!');
                            } else {
                                modal.querySelector('.gemini-status').textContent = 'STATUS: INVALID KEY';
                                showNotification('Invalid API key. Please try again.');
                            }
                        })
                        .catch(error => {
                            console.error('Failed to set API key:', error);
                            showNotification('Failed to set API key. Please try again.');
                        });
                    }
                });
            })
            .catch(error => {
                console.error('Failed to load stats:', error);
                modal.querySelector('.modal-body').innerHTML = `
                    <div class="error-message">
                        Failed to load statistics. Please try again.
                    </div>
                `;
            });
    }
    
    // Set up event listeners
    
    // Form submission
    taskForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            await addNewTask(taskText);
            taskInput.value = '';
        }
    });
    
    // Exit Tank Lock mode
    exitLockBtn.addEventListener('click', function() {
        // Clear countdown interval
        const countdownInterval = parseInt(tankLockMode.dataset.countdownInterval);
        if (!isNaN(countdownInterval)) {
            clearInterval(countdownInterval);
        }
        
        tankLockMode.classList.remove('tank-lock-active');
    });
    
    // Complete task button
    completeBtn.addEventListener('click', async function() {
        if (currentTaskInTankLock) {
            await completeTask(currentTaskInTankLock.id);
        }
    });
    
    // Surrender task button
    surrenderBtn.addEventListener('click', async function() {
        if (currentTaskInTankLock) {
            await surrenderTask(currentTaskInTankLock.id);
        }
    });
    
    // Toggle sound button
    toggleSoundBtn.addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        localStorage.setItem('soundEnabled', soundEnabled);
        toggleSoundBtn.textContent = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        
        if (soundEnabled) {
            soundIndicator.textContent = "SOUND SYSTEM ENGAGED, PRIVATE!";
        } else {
            soundIndicator.textContent = "RADIO SILENCE ENGAGED!";
        }
        
        soundIndicator.style.display = 'block';
        setTimeout(() => {
            soundIndicator.style.display = 'none';
        }, 3000);
    });
    
    // Show stats button
    showStatsBtn.addEventListener('click', showMissionStats);
    
    // Initial load
    loadTasks();
});