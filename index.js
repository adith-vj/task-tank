// Demo functionality for prototype
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskPriority = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const tankLockMode = document.getElementById('tank-lock-mode');
    const exitLockBtn = document.getElementById('exit-lock-btn');
    const completeBtn = document.getElementById('complete-btn');
    const surrenderBtn = document.getElementById('surrender-btn');
    const explosionContainer = document.getElementById('explosion-container');
    const soundIndicator = document.getElementById('sound-indicator');
    const toggleSoundBtn = document.getElementById('toggle-sound-btn');
    
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
        "Soldier! This isn't a vacation. You weren't built for comfort — you were made for greatness. Laziness is the enemy.",
        "Every second you waste, someone else gets stronger. Now get up, lock in, and do your damn duty!",
        "You want results? Then earn them. Pain is temporary. Regret? That sticks forever.",
        "So stand tall, focus up, and give it everything you've got. The battlefield rewards the brave — not the lazy!",
        "Discipline isn't optional, soldier — it's your lifeline.",
        "While you sit and wait, others are grinding, winning, rising.",
        "Hell no. It's earned in silence, in sweat, in struggle. So get off your back, tighten up, and MOVE!"
    ];
    
    // Sound setting
    let soundEnabled = true;

    // Initialize coin balance
    let coinBalance = parseInt(localStorage.getItem('coinBalance')) || 0;

    // Display initial coin balance
    const coinAmountDisplay = document.getElementById('coin-amount');
    coinAmountDisplay.textContent = coinBalance;
    
    function updateCoinBalance(amount) {
        coinBalance += amount;
        localStorage.setItem('coinBalance', coinBalance); // Persist in LocalStorage
        coinAmountDisplay.textContent = coinBalance;
    }

    // Priority labels map
    const priorityLabels = {
        '1': 'Low',
        '2': 'Medium',
        '3': 'High',
        '4': 'Urgent'
    };

    // Priority colors map
    const priorityColors = {
        '1': '#2a3a28',
        '2': '#3a5a36',
        '3': '#5a3a30',
        '4': '#8a2a0a'
    };
    
    // Add new task
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        const priority = taskPriority.value;
        
        if (taskText) {
            // Check if priority is urgent (4) and handle reassignment
            if (priority === '4') {
                // Find any existing urgent tasks and demote them to high priority
                const urgentTasks = document.querySelectorAll('.task-item[data-priority="4"]');
                urgentTasks.forEach(task => {
                    task.setAttribute('data-priority', '3');
                    const priorityBadge = task.querySelector('.priority-badge');
                    if (priorityBadge) {
                        priorityBadge.textContent = 'High';
                        priorityBadge.style.backgroundColor = priorityColors['3'];
                    }
                });
                
                // Show notification about priority change
                if (urgentTasks.length > 0) {
                    showNotification("Previous urgent task has been downgraded to high priority");
                }
            }
            
            addNewTask(taskText, priority);
            taskInput.value = '';
            
            // Sort tasks by priority
            sortTasksByPriority();
        }
    });
    
    // Add new task function
    function addNewTask(text, priority) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.setAttribute('data-priority', priority);
        taskItem.innerHTML = `
            <div class="task-content">
                <span class="priority-badge" style="background-color: ${priorityColors[priority]}">${priorityLabels[priority]}</span>
                <span class="task-title">${text}</span>
            </div>
            <div class="task-actions">
                <button class="task-btn tank-lock-btn">TANK LOCK</button>
                <button class="task-btn destroy-btn">DESTROY</button>
            </div>
        `;
        
        // Add event listeners to buttons
        const tankLockBtn = taskItem.querySelector('.tank-lock-btn');
        tankLockBtn.addEventListener('click', function() {
            enterTankLock(text);
        });
        
        const destroyBtn = taskItem.querySelector('.destroy-btn');
        destroyBtn.addEventListener('click', function() {
            destroyTask(taskItem, text);
        });
        
        // Add to list
        taskList.prepend(taskItem);
        
        // Sort tasks by priority
        sortTasksByPriority();
    }
    
    // Sort tasks by priority (highest to lowest)
    function sortTasksByPriority() {
        const tasks = Array.from(taskList.querySelectorAll('.task-item'));
        
        // Sort tasks by priority (highest to lowest)
        tasks.sort((a, b) => {
            const priorityA = parseInt(a.getAttribute('data-priority'));
            const priorityB = parseInt(b.getAttribute('data-priority'));
            return priorityB - priorityA;
        });
        
        // Remove all tasks from the list
        tasks.forEach(task => task.remove());
        
        // Add tasks back in the correct order
        tasks.forEach(task => taskList.appendChild(task));
    }
    
    // Set up event listeners for existing buttons
    document.querySelectorAll('.task-btn').forEach(btn => {
        if (btn.textContent === 'TANK LOCK') {
            btn.addEventListener('click', function() {
                const taskTitle = btn.closest('.task-item').querySelector('.task-title').textContent;
                enterTankLock(taskTitle);
            });
        } else if (btn.textContent === 'DESTROY') {
            btn.addEventListener('click', function() {
                const taskItem = btn.closest('.task-item');
                const taskTitle = taskItem.querySelector('.task-title').textContent;
                destroyTask(taskItem, taskTitle);
            });
        }
    });
    
    // Enter Tank Lock mode
    function enterTankLock(taskTitle) {
        // Update focused task title
        document.querySelector('.focused-task-title').textContent = taskTitle;

        // Generate and display subtasks
        generateSubtasks(taskTitle);

        let tankLockStartTime = Date.now();
        
        // Show random timer (between 10-20 minutes)
        let minutes = Math.floor(Math.random() * 10) + 10;
        let seconds = Math.floor(Math.random() * 60);
        
        const timerElement = document.getElementById('countdown-timer');
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const tankLockMode = document.getElementById('tank-lock-mode');
        // Show Tank Lock mode
        tankLockMode.classList.add('tank-lock-active');

        setupSubtaskListeners();
        
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
                showNotification();
            }
        }, 1000);
        
        // Play random command
        if (soundEnabled) {
            const randomCommand = tankCommands[Math.floor(Math.random() * tankCommands.length)];
            soundIndicator.textContent = `"${randomCommand}"`;
            soundIndicator.style.display = 'block';
            
            // Update commander message in Tank Lock mode
            document.querySelector('.commander-message').textContent = randomCommand;
            
            // Hide sound indicator after animation
            setTimeout(() => {
                soundIndicator.style.display = 'none';
            }, 3000);
        }
        
        // Set up event listeners for Tank Lock controls
        const exitLockBtn = document.getElementById('exit-lock-btn');
        const completeBtn = document.getElementById('complete-btn');
        const surrenderBtn = document.getElementById('surrender-btn');
        
        exitLockBtn.addEventListener('click', () => {
            clearInterval(countdown);
            tankLockMode.classList.remove('tank-lock-active');
            awardCoins();
        });
        
        completeBtn.addEventListener('click', () => {
            clearInterval(countdown);
            tankLockMode.classList.remove('tank-lock-active');
            awardCoins();
            // Show explosion animation
            explosionContainer.style.display = 'flex';
            setTimeout(() => {
                explosionContainer.style.display = 'none';
            }, 1000);
        });
        
        surrenderBtn.addEventListener('click', () => {
            clearInterval(countdown);
            tankLockMode.classList.remove('tank-lock-active');
            // Add task to wreckage pile
            const wreckageItems = document.querySelector('.wreckage-items');
            const wreckageItem = document.createElement('div');
            wreckageItem.className = 'wreckage-item';
            wreckageItem.innerHTML = `
                <span class="wreckage-task-title">${taskTitle}</span>
                <button class="reclaim-btn">SALVAGE</button>
            `;
            wreckageItems.appendChild(wreckageItem);
        });
    }
    
    // Generate subtasks for a task
    function generateSubtasks(taskTitle) {
        // Get the subtasks container
        const subtasksList = document.getElementById('focused-subtasks');
        subtasksList.innerHTML = ''; // Clear existing subtasks
        
        // Show loading state
        subtasksList.innerHTML = '<div class="loading">Generating subtasks...</div>';
        
        // Make API call to generate subtasks
        fetch('/api/generate-subtasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                taskTitle: taskTitle
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to generate subtasks');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Clear loading state
            subtasksList.innerHTML = '';
            
            // Create the subtasks
            data.subtasks.forEach((subtask, index) => {
                const subtaskItem = document.createElement('div');
                subtaskItem.className = 'subtask-item';
                subtaskItem.innerHTML = `
                    <input type="checkbox" id="subtask-${index+1}" class="subtask-checkbox">
                    <label for="subtask-${index+1}">${subtask.title}</label>
                `;
                subtasksList.appendChild(subtaskItem);
            });
            
            // Reset progress bar
            document.querySelector('.progress-bar').style.width = '0%';
            
            // Set up event listeners for the new subtasks
            setupSubtaskListeners();
        })
        .catch(error => {
            console.error('Error generating subtasks:', error);
            // Clear loading state
            subtasksList.innerHTML = '';
            
            // Fallback to default subtasks
            const defaultSubtasks = [
                `Research and gather information about ${taskTitle}`,
                `Create initial structure for ${taskTitle}`,
                `Develop core components of ${taskTitle}`,
                `Review and finalize ${taskTitle}`
            ];
            
            defaultSubtasks.forEach((subtask, index) => {
                const subtaskItem = document.createElement('div');
                subtaskItem.className = 'subtask-item';
                subtaskItem.innerHTML = `
                    <input type="checkbox" id="subtask-${index+1}" class="subtask-checkbox">
                    <label for="subtask-${index+1}">${subtask}</label>
                `;
                subtasksList.appendChild(subtaskItem);
            });
            
            // Reset progress bar
            document.querySelector('.progress-bar').style.width = '0%';
            
            // Set up event listeners for the default subtasks
            setupSubtaskListeners();
        });
    }
    
    // Function to set up event listeners for subtasks
    function setupSubtaskListeners() {
        const subtaskCheckboxes = document.querySelectorAll('.subtask-checkbox');
        const progressBar = document.querySelector('.progress-bar');
        
        subtaskCheckboxes.forEach(checkbox => {
            checkbox.checked = false; // Reset all checkboxes
            checkbox.addEventListener('change', () => {
                // Calculate progress based on checked subtasks
                const totalSubtasks = subtaskCheckboxes.length;
                const completedSubtasks = Array.from(subtaskCheckboxes).filter(cb => cb.checked).length;
                const progressPercentage = (completedSubtasks / totalSubtasks) * 100;
                
                // Update progress bar
                progressBar.style.width = `${progressPercentage}%`;
                
                // If all subtasks are completed, suggest completing the task
                if (completedSubtasks === totalSubtasks) {
                    showNotification("All objectives completed! Ready to finish the mission!");
                }
            });
        });
    }
    
    // Exit Tank Lock mode
    exitLockBtn.addEventListener('click', function() {
        tankLockMode.classList.remove('tank-lock-active');
    });
    
    surrenderBtn.addEventListener('click', function() {
        // Get current task
        const taskTitle = document.querySelector('.focused-task-title').textContent;
        
        // Add to wreckage pile
        const wreckageItems = document.querySelector('.wreckage-items');
        const wreckageItem = document.createElement('div');
        wreckageItem.className = 'wreckage-item';
        wreckageItem.innerHTML = `
            <span class="wreckage-task-title">${taskTitle}</span>
            <button class="reclaim-btn">SALVAGE</button>
        `;
        
        // Add event listener to reclaim button
        const reclaimBtn = wreckageItem.querySelector('.reclaim-btn');
        reclaimBtn.addEventListener('click', function() {
            wreckageItem.remove();
            // Default to medium priority when reclaiming
            addNewTask(taskTitle, '2');
        });
        
        wreckageItems.prepend(wreckageItem);
        
        // Exit Tank Lock mode
        tankLockMode.classList.remove('tank-lock-active');
        
        // Play failure sound command
        if (soundEnabled) {
            soundIndicator.textContent = `"PATHETIC! ANOTHER MISSION FAILED!"`;
            soundIndicator.style.display = 'block';
            
            setTimeout(() => {
                soundIndicator.style.display = 'none';
            }, 3000);
        }
    });
    
    // Complete task with explosion
    completeBtn.addEventListener('click', function() {
        // Get current task
        const taskTitle = document.querySelector('.focused-task-title').textContent;
        
        // Show explosion animation
        explosionContainer.style.display = 'flex';
        
        // Play completion sound
        if (soundEnabled) {
            soundIndicator.textContent = `"OUTSTANDING! MISSION ACCOMPLISHED!"`;
            soundIndicator.style.display = 'block';
            
            setTimeout(() => {
                soundIndicator.style.display = 'none';
            }, 3000);
        }
        
        // Hide explosion and exit Tank Lock after animation
        setTimeout(() => {
            explosionContainer.style.display = 'none';
            tankLockMode.classList.remove('tank-lock-active');
            
            // Remove task from list
            const taskItems = document.querySelectorAll('.task-item');
            taskItems.forEach(item => {
                if (item.querySelector('.task-title').textContent === taskTitle) {
                    item.remove();
                }
            });
            
        }, 1000);
    });
    
    // Destroy task function
    function destroyTask(taskItem, taskTitle) {
        // Show explosion animation
        explosionContainer.style.display = 'flex';
        
        // Play completion sound
        if (soundEnabled) {
            soundIndicator.textContent = `"TARGET DESTROYED! EXCELLENT WORK, SOLDIER!"`;
            soundIndicator.style.display = 'block';
            
            setTimeout(() => {
                soundIndicator.style.display = 'none';
            }, 3000);
        }
        
        // Hide explosion after animation
        setTimeout(() => {
            explosionContainer.style.display = 'none';
            taskItem.remove();
            
            // Check if there are any urgent tasks left
            const urgentTasks = document.querySelectorAll('.task-item[data-priority="4"]');
            if (urgentTasks.length === 0) {
                // Optionally promote the highest priority task to urgent
                // This is commented out as it wasn't part of requirements, but could be useful
                /*
                const highTasks = document.querySelectorAll('.task-item[data-priority="3"]');
                if (highTasks.length > 0) {
                    const firstHighTask = highTasks[0];
                    firstHighTask.setAttribute('data-priority', '4');
                    const priorityBadge = firstHighTask.querySelector('.priority-badge');
                    if (priorityBadge) {
                        priorityBadge.textContent = 'Urgent';
                        priorityBadge.style.backgroundColor = priorityColors['4'];
                    }
                    showNotification("A high priority task has been promoted to urgent");
                }
                */
            }
        }, 1000);
    }
    
    // Toggle sound
    toggleSoundBtn.addEventListener('click', function() {
        soundEnabled = !soundEnabled;
        toggleSoundBtn.textContent = soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        
        if (soundEnabled) {
            soundIndicator.textContent = `"SOUND SYSTEM ENGAGED, PRIVATE!"`;
        } else {
            soundIndicator.textContent = `"RADIO SILENCE ENGAGED!"`;
        }
        
        soundIndicator.style.display = 'block';
        setTimeout(() => {
            soundIndicator.style.display = 'none';
        }, 3000);
    });
    
    // Add event listeners to reclaim buttons
    document.querySelectorAll('.reclaim-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const wreckageItem = btn.closest('.wreckage-item');
            const taskTitle = wreckageItem.querySelector('.wreckage-task-title').textContent;
            wreckageItem.remove();
            // Default to medium priority when reclaiming
            addNewTask(taskTitle, '2');
        });
    });
    
    function showNotification(customMessage) {
        const message = customMessage || notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
    
        // Create notification element
        const notification = document.createElement('div');
        notification.classList.add('notification');
    
        // Add image and message to the notification
        notification.innerHTML = `
            <img src="asset_images/col.png" class="notification-icon" alt ="Styled Image" style="border: 4px solid #3a5a36; border-radius: 10px;" width="100" height="100"/>
            <span>${message}</span>`;

            if (soundEnabled) {
                let audio;
                if (message.includes("Soldier! This isn't a vacation. You weren't built for comfort — you were made for greatness. Laziness is the enemy.") ) {
                    audio = document.getElementById("notify-1");
                } else if (message.includes("Every second you waste, someone else gets stronger. Now get up, lock in, and do your damn duty!") ) {
                    audio = document.getElementById("notify-2");
                } else if (message.includes("You want results? Then earn them. Pain is temporary. Regret? That sticks forever.") ) {
                    audio = document.getElementById("notify-3");
                }else if (message.includes("So stand tall, focus up, and give it everything you've got. The battlefield rewards the brave — not the lazy!") ) {
                    audio = document.getElementById("notify-4");
                } else if (message.includes("Discipline isn't optional, soldier — it's your lifeline.")) {
                    audio = document.getElementById("notify-5");
                }else if (message.includes("While you sit and wait, others are grinding, winning, rising.") ) {
                    audio = document.getElementById("notify-6");
                } else if (message.includes("Hell no. It's earned in silence, in sweat, in struggle. So get off your back, tighten up, and MOVE!")) {
                    audio = document.getElementById("notify-7");
                }
        
                if (audio) {
                    audio.currentTime = 0;
                    audio.play();
                }
            }
    
        // Append to body and show
        document.body.appendChild(notification);
        setTimeout(() => notification.style.opacity = 1, 10); // Small delay to trigger transition
    
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => notification.remove(), 500);
        }, 8000);
    }
    
    
    // Add CSS style for priority badge
    const style = document.createElement('style');
    style.textContent = `
        .priority-badge {
            padding: 3px 8px;
            border-radius: 12px;
            color: #d3ffce;
            font-size: 0.8rem;
            font-weight: bold;
            margin-right: 10px;
        }
        
        .task-item[data-priority="4"] {
            border-left: 5px solid #8a2a0a;
            border-color: #8a2a0a;
        }
    `;
    document.head.appendChild(style);
    // Add this code to your existing DOMContentLoaded event listener
const showShopBtn = document.getElementById('show-shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');
const armoryShop = document.getElementById('armory-shop');
const shopCoinAmount = document.getElementById('shop-coin-amount');
const inventoryItems = document.getElementById('inventory-items');

// Initialize inventory from localStorage or create empty one
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

// Show shop
showShopBtn.addEventListener('click', function() {
    armoryShop.classList.add('show');
    shopCoinAmount.textContent = coinBalance;
    updateBuyButtons();
    renderInventory();
});

// Close shop
closeShopBtn.addEventListener('click', function() {
    armoryShop.classList.remove('show');
});

// Setup buy buttons
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const weaponItem = this.closest('.weapon-item');
        const weaponType = weaponItem.getAttribute('data-weapon');
        const weaponPrice = parseInt(weaponItem.getAttribute('data-price'));
        
        // Check if user has enough coins
        if (coinBalance >= weaponPrice) {
            // Check if weapon is already in inventory
            if (!inventory.includes(weaponType)) {
                // Deduct coins
                updateCoinBalance(-weaponPrice);
                shopCoinAmount.textContent = coinBalance;
                
                // Add to inventory
                inventory.push(weaponType);
                localStorage.setItem('inventory', JSON.stringify(inventory));
                
                // Show purchase notification
                showPurchaseNotification(weaponType);
                
                // Render updated inventory
                renderInventory();
                
                // Update buy buttons state
                updateBuyButtons();
            } else {
                showNotification("You already own this weapon!");
            }
        } else {
            showNotification("Not enough coins! Complete more tasks to earn coins.");
        }
    });
});

// Update buy buttons based on coin balance and inventory
function updateBuyButtons() {
    document.querySelectorAll('.weapon-item').forEach(item => {
        const weaponType = item.getAttribute('data-weapon');
        const weaponPrice = parseInt(item.getAttribute('data-price'));
        const buyBtn = item.querySelector('.buy-btn');
        
        // Disable if not enough coins or already owned
        if (coinBalance < weaponPrice || inventory.includes(weaponType)) {
            buyBtn.classList.add('disabled');
            buyBtn.textContent = inventory.includes(weaponType) ? "OWNED" : "INSUFFICIENT FUNDS";
        } else {
            buyBtn.classList.remove('disabled');
            buyBtn.textContent = "PURCHASE";
        }
    });
}

// Render inventory items
function renderInventory() {
    // Clear inventory display
    inventoryItems.innerHTML = '';
    
    // Show empty message if inventory is empty
    if (inventory.length === 0) {
        inventoryItems.innerHTML = '<div class="empty-inventory">No weapons acquired yet. Complete missions to earn coins!</div>';
        return;
    }
    
    // Map of weapon types to display names
    const weaponNames = {
        'pistol': 'Combat Pistol',
        'shotgun': 'Tactical Shotgun',
        'rifle': 'Battle Rifle',
        'sniper': 'Precision Sniper'
    };
    
    // Add each weapon to inventory display
    inventory.forEach(weaponType => {
        const weaponElement = document.createElement('div');
        weaponElement.className = 'inventory-weapon';
        weaponElement.innerHTML = `
            <div class="inventory-weapon-image ${weaponType}"></div>
            <div class="inventory-weapon-name">${weaponNames[weaponType]}</div>
        `;
        inventoryItems.appendChild(weaponElement);
    });
}

// Show purchase notification
function showPurchaseNotification(weaponType) {
    const weaponNames = {
        'pistol': 'Combat Pistol',
        'shotgun': 'Tactical Shotgun',
        'rifle': 'Battle Rifle',
        'sniper': 'Precision Sniper'
    };
    
    const notification = document.createElement('div');
    notification.className = 'purchase-notification';
    notification.innerHTML = `
        <h3>WEAPON ACQUIRED</h3>
        <p>You have successfully purchased the ${weaponNames[weaponType]}!</p>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after animation completes
    setTimeout(() => {
        notification.remove();
    }, 2000);
}
});