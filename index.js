 // Demo functionality for prototype
 document.addEventListener('DOMContentLoaded', function() {
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

    
    // Add new task
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const taskText = taskInput.value.trim();
        if (taskText) {
            addNewTask(taskText);
            taskInput.value = '';
        }
    });

    
    
    // Add new task function
    function addNewTask(text) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.innerHTML = `
            <div class="task-content">
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

        let tankLockStartTime = Date.now();
        
        // Show random timer (between 10-20 minutes)
        let minutes = Math.floor(Math.random() * 10) + 10;
        let seconds = Math.floor(Math.random() * 60);
        
        const timerElement = document.getElementById('countdown-timer');
        timerElement.textContent =  `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const tankLockMode = document.querySelector('.tank-lock-mode'); // Make sure it's defined in your HTML
        // Show Tank Lock mode
        tankLockMode.classList.add('tank-lock-active');
        


        let countdown = setInterval(() => {
            if (seconds === 0) {
                if (minutes === 0) {
                    clearInterval(countdown); // Stop the timer
                    timerElement.textContent = "00:00"; // Display "Time's up" message
                    // Optionally trigger a task completion or alert
                    alert("Time's up! Tank Lock mode complete!");
                    return;
                }
                minutes--; // Decrease minutes
                seconds = 59; // Reset seconds to 59sssssss
            } else {
                seconds--; // Decrease seconds
            }
            // Update the timer display
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (Math.random() < 0.2) { // ~20% chance per second
                showNotification();
            }
        }, 1000); // Update every second
    
        
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
        function awardCoins() {
            const timeSpent = Math.floor((Date.now(x) - tankLockStartTime) / 1000); // Time in seconds
            const coinsEarned = Math.floor(timeSpent / 60); // 1 coin per minute
            updateCoinBalance(coinsEarned);
        
            // Notify the user
            alert(`You earned ${coinsEarned} coins for working ${Math.floor(timeSpent / 60)} minutes!`);
        }
        
        const surrenderButton = document.getElementById('surrender-btn');
        const completeButton=document.getElementById('complete-btn');
        const exitbutton=document.getElementById('exit-lock-btn');
        surrenderButton.addEventListener('click', () => {
            clearInterval(countdown); // Stop the countdown
            tankLockMode.classList.remove('tank-lock-active'); // Exit Tank Lock mode
            timerElement.textContent = "SURRENDERED"; // Optionally update timer text
            awardCoins();
        });
        completeButton.addEventListener('click', () => {
            clearInterval(countdown); // Stop the countdown
            tankLockMode.classList.remove('tank-lock-active'); // Exit Tank Lock mode
            timerElement.textContent = "SURRENDERED"; // Optionally update timer text
            awardCoins();
        });
        exitbutton.addEventListener('click', () => {
            clearInterval(countdown); // Stop the countdown
            tankLockMode.classList.remove('tank-lock-active'); // Exit Tank Lock mode
            timerElement.textContent = "SURRENDERED"; // Optionally update timer text
            awardCoins();
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
            addNewTask(taskTitle);
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
            addNewTask(taskTitle);
        });
    });
    function showNotification() {
        const message = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
    
        // Create notification element
        const notification = document.createElement('div');
        notification.classList.add('notification');
        notification.textContent = message;
    
        // Append to body and show
        document.body.appendChild(notification);
        notification.style.opacity = 1;
    
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => notification.remove(), 500); // Remove from DOM after fading out
        }, 3000);
    }
});