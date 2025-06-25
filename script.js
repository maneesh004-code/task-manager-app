// Task Manager JavaScript

class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.reminderInterval = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTasks();
        this.startReminderCheck();
    }

    initializeElements() {
        // Form elements
        this.taskForm = document.getElementById('taskForm');
        this.taskTitle = document.getElementById('taskTitle');
        this.taskDescription = document.getElementById('taskDescription');
        this.taskDueDate = document.getElementById('taskDueDate');
        this.taskPriority = document.getElementById('taskPriority');
        this.addBtn = document.getElementById('addBtn');
        this.cancelBtn = document.getElementById('cancelBtn');

        // Filter elements
        this.filterBtns = document.querySelectorAll('.filter-btn');

        // Display elements
        this.tasksList = document.getElementById('tasksList');
        this.notifications = document.getElementById('notifications');

        // Stats elements
        this.totalTasksElement = document.getElementById('totalTasks');
        this.pendingTasksElement = document.getElementById('pendingTasks');
        this.completedTasksElement = document.getElementById('completedTasks');
        this.overdueTasksElement = document.getElementById('overdueTasks');
    }

    bindEvents() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Cancel button
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Set minimum date to current date/time
        const now = new Date();
        const minDateTime = now.toISOString().slice(0, 16);
        this.taskDueDate.min = minDateTime;
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const title = this.taskTitle.value.trim();
        const description = this.taskDescription.value.trim();
        const dueDate = this.taskDueDate.value;
        const priority = this.taskPriority.value;

        if (!title || !dueDate) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        if (this.editingTaskId) {
            this.updateTask();
        } else {
            this.addTask(title, description, dueDate, priority);
        }
    }

    addTask(title, description, dueDate, priority) {
        const task = {
            id: Date.now(),
            title,
            description,
            dueDate: new Date(dueDate),
            priority,
            completed: false,
            createdAt: new Date()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.resetForm();
        this.showNotification('Task added successfully!', 'success');
    }

    updateTask() {
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.title = this.taskTitle.value.trim();
            task.description = this.taskDescription.value.trim();
            task.dueDate = new Date(this.taskDueDate.value);
            task.priority = this.taskPriority.value;

            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.resetForm();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.editingTaskId = taskId;
            this.taskTitle.value = task.title;
            this.taskDescription.value = task.description;
            this.taskDueDate.value = task.dueDate.toISOString().slice(0, 16);
            this.taskPriority.value = task.priority;

            this.addBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';
            this.cancelBtn.style.display = 'inline-block';
            
            // Scroll to form
            document.querySelector('.add-task-section').scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    toggleComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task marked as complete!' : 'Task marked as incomplete!';
            this.showNotification(message, 'success');
        }
    }

    handleFilter(e) {
        const filter = e.target.dataset.filter;
        this.currentFilter = filter;

        // Update active filter button
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        this.renderTasks();
    }

    getFilteredTasks() {
        const now = new Date();
        
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed && task.dueDate > now);
            case 'overdue':
                return this.tasks.filter(task => !task.completed && task.dueDate <= now);
            default:
                return this.tasks;
        }
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.tasksList.innerHTML = `
                <div class="no-tasks">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks found for the selected filter.</p>
                </div>
            `;
            return;
        }

        // Sort tasks by due date (earliest first)
        filteredTasks.sort((a, b) => a.dueDate - b.dueDate);

        this.tasksList.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        
        // Bind event listeners to task buttons
        filteredTasks.forEach(task => {
            const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
            
            taskElement.querySelector('.complete-btn').addEventListener('click', () => this.toggleComplete(task.id));
            taskElement.querySelector('.edit-btn').addEventListener('click', () => this.editTask(task.id));
            taskElement.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));
        });
    }

    createTaskHTML(task) {
        const now = new Date();
        const isOverdue = !task.completed && task.dueDate <= now;
        const isDueSoon = !task.completed && task.dueDate > now && task.dueDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const dueDateClass = isOverdue ? 'overdue' : (isDueSoon ? 'due-soon' : '');
        const taskClass = `task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
        
        return `
            <div class="${taskClass}" data-task-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                </div>
                
                ${task.description ? `<p class="task-description">${this.escapeHtml(task.description)}</p>` : ''}
                
                <div class="task-meta">
                    <div class="task-due-date ${dueDateClass}">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Due: ${this.formatDate(task.dueDate)}</span>
                        ${isOverdue ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
                        ${isDueSoon ? '<i class="fas fa-clock"></i>' : ''}
                    </div>
                    
                    <div class="task-actions">
                        <button class="complete-btn ${task.completed ? 'incomplete-btn' : ''}">
                            <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                            ${task.completed ? 'Undo' : 'Complete'}
                        </button>
                        <button class="edit-btn">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="delete-btn">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const now = new Date();
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = this.tasks.filter(task => !task.completed).length;
        const overdue = this.tasks.filter(task => !task.completed && task.dueDate <= now).length;

        this.totalTasksElement.textContent = total;
        this.pendingTasksElement.textContent = pending;
        this.completedTasksElement.textContent = completed;
        this.overdueTasksElement.textContent = overdue;
    }

    resetForm() {
        this.taskForm.reset();
        this.editingTaskId = null;
        this.addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
        this.cancelBtn.style.display = 'none';
        
        // Reset minimum date
        const now = new Date();
        const minDateTime = now.toISOString().slice(0, 16);
        this.taskDueDate.min = minDateTime;
    }

    cancelEdit() {
        this.resetForm();
        this.showNotification('Edit cancelled', 'warning');
    }

    startReminderCheck() {
        // Check for upcoming deadlines every minute
        this.reminderInterval = setInterval(() => {
            this.checkReminders();
        }, 60000);
        
        // Initial check
        this.checkReminders();
    }

    checkReminders() {
        const now = new Date();
        const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
        
        this.tasks.forEach(task => {
            if (!task.completed && task.dueDate <= reminderTime && task.dueDate > now) {
                const timeLeft = this.getTimeLeft(task.dueDate);
                this.showNotification(`Reminder: "${task.title}" is due ${timeLeft}`, 'warning');
            }
        });
    }

    getTimeLeft(dueDate) {
        const now = new Date();
        const diff = dueDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `in ${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        this.notifications.appendChild(notification);
        
        // Auto remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'exclamation-circle';
            case 'warning':
                return 'exclamation-triangle';
            default:
                return 'info-circle';
        }
    }

    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Storage methods - using localStorage with fallback to memory storage
    saveTasks() {
        try {
            localStorage.setItem('taskManagerTasks', JSON.stringify(this.tasks.map(task => ({
                ...task,
                dueDate: task.dueDate.toISOString(),
                createdAt: task.createdAt.toISOString()
            }))));
        } catch (error) {
            console.warn('localStorage not available, using memory storage');
            // Tasks will persist in memory during the session
        }
    }

    loadTasks() {
        try {
            const stored = localStorage.getItem('taskManagerTasks');
            if (stored) {
                const parsedTasks = JSON.parse(stored);
                this.tasks = parsedTasks.map(task => ({
                    ...task,
                    dueDate: new Date(task.dueDate),
                    createdAt: new Date(task.createdAt)
                }));
            }
        } catch (error) {
            console.warn('Could not load tasks from localStorage');
            this.tasks = [];
        }
        
        this.renderTasks();
        this.updateStats();
    }

    // Cleanup method
    destroy() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
        }
    }
}

// Initialize the Task Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    
    // Make it globally accessible for debugging
    window.taskManager = taskManager;
});