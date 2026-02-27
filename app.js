// FirstThingsFirst PWA - Application Logic

class FirstThingsFirst {
    constructor() {
        this.tasks = [];
        this.categories = [];
        this.projects = [];
        this.settings = {
            q1: { color: '#AEE7B1', label: 'Do This' },
            q2: { color: '#ABBEE1', label: 'Schedule This' },
            q3: { color: '#BCB5F0', label: 'Assign This' },
            q4: { color: '#F5D26C', label: 'Consider This' },
            theme: 'dark'
        };
        this.currentView = 'quadrant';
        this.editingTaskId = null;
        this.editingListItemId = null;
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.applyTheme();
        this.updateThemeDropdownButton();
        this.applySettings();
        this.renderQuadrants();
        this.updateCategoryProjectSelects();
    }

    // Data Management
    loadData() {
        const data = localStorage.getItem('firstthingsfirst_data');
        if (data) {
            const parsed = JSON.parse(data);
            this.tasks = parsed.tasks || [];
            this.categories = parsed.categories || [];
            this.projects = parsed.projects || [];
            this.settings = parsed.settings || this.settings;
        }
    }

    saveData() {
        const data = {
            tasks: this.tasks,
            categories: this.categories,
            projects: this.projects,
            settings: this.settings
        };
        localStorage.setItem('firstthingsfirst_data', JSON.stringify(data));
    }

    // Event Listeners
    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('addBtn').addEventListener('click', () => this.openTaskModal());

        // View dropdown
        document.getElementById('viewDropdownBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown('viewDropdown');
        });
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.closeAllDropdowns();
                this.setView(view);
            });
        });

        // Settings dropdown
        document.getElementById('settingsDropdownBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown('settingsDropdown');
        });
        document.getElementById('themeToggleBtn').addEventListener('click', () => {
            this.toggleTheme();
            this.updateThemeDropdownButton();
        });
        document.getElementById('listBtn').addEventListener('click', () => {
            this.closeAllDropdowns();
            this.openListsModal();
        });
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.closeAllDropdowns();
            this.openSettingsModal();
        });
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.closeAllDropdowns();
            this.exportData();
        });
        document.getElementById('importBtn').addEventListener('click', () => {
            this.closeAllDropdowns();
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.closeAllDropdowns();
            this.clearAllData();
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            this.closeAllDropdowns();
        });

        // Task Modal
        document.getElementById('closeTaskModal').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('deleteTaskBtn').addEventListener('click', () => this.deleteTask());
        document.getElementById('saveTaskBtn').addEventListener('click', (e) => this.saveTask(e));

        // Lists Modal
        document.getElementById('closeListsModal').addEventListener('click', () => this.closeListsModal());
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.openListItemModal('category'));
        document.getElementById('addProjectBtn').addEventListener('click', () => this.openListItemModal('project'));

        // List Item Modal
        document.getElementById('closeListItemModal').addEventListener('click', () => this.closeListItemModal());
        document.getElementById('cancelListItemBtn').addEventListener('click', () => this.closeListItemModal());
        document.getElementById('saveListItemBtn').addEventListener('click', (e) => this.saveListItem(e));

        // Color picker sync
        this.setupColorPickers();

        // Settings Modal (modal-specific actions only)
        document.getElementById('closeSettingsModal').addEventListener('click', () => this.closeSettingsModal());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettingsBtn').addEventListener('click', () => this.resetSettings());

        // Drag and drop
        this.setupDragAndDrop();

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    }

    setupColorPickers() {
        const pairs = [
            ['listItemColor', 'listItemColorHex'],
            ['q1Color', 'q1ColorHex'],
            ['q2Color', 'q2ColorHex'],
            ['q3Color', 'q3ColorHex'],
            ['q4Color', 'q4ColorHex']
        ];

        pairs.forEach(([colorId, hexId]) => {
            const colorInput = document.getElementById(colorId);
            const hexInput = document.getElementById(hexId);

            if (colorInput && hexInput) {
                colorInput.addEventListener('input', (e) => {
                    hexInput.value = e.target.value.toUpperCase();
                });

                hexInput.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        colorInput.value = value;
                    }
                });
            }
        });
    }

    setupDragAndDrop() {
        const quadrants = document.querySelectorAll('.quadrant');

        quadrants.forEach(quadrant => {
            quadrant.addEventListener('dragover', (e) => {
                e.preventDefault();
                quadrant.classList.add('drag-over');
            });

            quadrant.addEventListener('dragleave', () => {
                quadrant.classList.remove('drag-over');
            });

            quadrant.addEventListener('drop', (e) => {
                e.preventDefault();
                quadrant.classList.remove('drag-over');

                const taskId = e.dataTransfer.getData('taskId');
                const targetQuadrant = parseInt(quadrant.dataset.quadrant);
                this.moveTask(taskId, targetQuadrant);
            });
        });
    }

    // Task Management
    openTaskModal(taskId = null) {
        this.editingTaskId = taskId;
        const modal = document.getElementById('taskModal');
        const modalBody = modal.querySelector('.modal-body');
        const form = document.getElementById('taskForm');
        const deleteBtn = document.getElementById('deleteTaskBtn');
        const datesGroup = document.getElementById('taskDatesGroup');
        const completedDateContainer = document.getElementById('taskCompletedDateContainer');

        // Scroll modal body to top
        if (modalBody) {
            modalBody.scrollTop = 0;
        }

        form.reset();

        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('modalTitle').textContent = 'Edit Task';
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskNotes').value = task.notes || '';
                document.getElementById('taskUrgent').checked = task.urgent;
                document.getElementById('taskImportant').checked = task.important;
                document.getElementById('taskCategory').value = task.category || '';
                document.getElementById('taskProject').value = task.project || '';
                document.getElementById('taskDueDate').value = task.dueDate || '';
                document.getElementById('taskRecurring').checked = task.recurring || false;
                document.getElementById('taskCompleted').checked = task.completed || false;
                deleteBtn.style.display = 'block';

                // Show and populate date fields
                datesGroup.classList.remove('hidden');
                document.getElementById('taskCreatedDate').value = this.formatDateTime(task.createdAt);
                document.getElementById('taskModifiedDate').value = this.formatDateTime(task.modifiedAt || task.createdAt);

                // Show completed date if task is completed
                if (task.completed && task.completedAt) {
                    completedDateContainer.classList.remove('hidden');
                    document.getElementById('taskCompletedDate').value = this.formatDateTime(task.completedAt);
                } else {
                    completedDateContainer.classList.add('hidden');
                }
            }
        } else {
            document.getElementById('modalTitle').textContent = 'Add Task';
            deleteBtn.style.display = 'none';
            datesGroup.classList.add('hidden');
            completedDateContainer.classList.add('hidden');
        }

        modal.classList.add('active');

        // Focus on title field after modal animation
        setTimeout(() => {
            document.getElementById('taskTitle').focus();
        }, 100);
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('active');
        this.editingTaskId = null;
    }

    saveTask(e) {
        e.preventDefault();

        const now = new Date().toISOString();
        const wasCompleted = this.editingTaskId ?
            this.tasks.find(t => t.id === this.editingTaskId)?.completed :
            false;
        const isNowCompleted = document.getElementById('taskCompleted').checked;

        const task = {
            id: this.editingTaskId || Date.now().toString(),
            title: document.getElementById('taskTitle').value.trim(),
            notes: document.getElementById('taskNotes').value.trim(),
            urgent: document.getElementById('taskUrgent').checked,
            important: document.getElementById('taskImportant').checked,
            category: document.getElementById('taskCategory').value,
            project: document.getElementById('taskProject').value,
            dueDate: document.getElementById('taskDueDate').value,
            recurring: document.getElementById('taskRecurring').checked,
            completed: isNowCompleted,
            createdAt: this.editingTaskId ?
                this.tasks.find(t => t.id === this.editingTaskId)?.createdAt :
                now,
            modifiedAt: now
        };

        // Track completed date
        if (isNowCompleted && !wasCompleted) {
            // Task just became completed
            task.completedAt = now;
        } else if (isNowCompleted && wasCompleted) {
            // Task was already completed, keep original completed date
            task.completedAt = this.tasks.find(t => t.id === this.editingTaskId)?.completedAt || now;
        } else if (!isNowCompleted && wasCompleted) {
            // Task was uncompleted, remove completed date
            task.completedAt = null;
        }

        if (this.editingTaskId) {
            const index = this.tasks.findIndex(t => t.id === this.editingTaskId);
            this.tasks[index] = task;
        } else {
            this.tasks.push(task);
        }

        this.saveData();
        this.closeTaskModal();
        this.renderCurrentView();
    }

    deleteTask() {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== this.editingTaskId);
            this.saveData();
            this.closeTaskModal();
            this.renderCurrentView();
        }
    }

    moveTask(taskId, targetQuadrant) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Update urgent and important based on quadrant
        switch(targetQuadrant) {
            case 1: // Urgent & Important
                task.urgent = true;
                task.important = true;
                break;
            case 2: // Not Urgent & Important
                task.urgent = false;
                task.important = true;
                break;
            case 3: // Urgent & Not Important
                task.urgent = true;
                task.important = false;
                break;
            case 4: // Not Urgent & Not Important
                task.urgent = false;
                task.important = false;
                break;
        }

        this.saveData();
        this.renderQuadrants();
    }

    getQuadrant(task) {
        if (task.urgent && task.important) return 1;
        if (!task.urgent && task.important) return 2;
        if (task.urgent && !task.important) return 3;
        return 4;
    }

    // Rendering
    renderQuadrants() {
        for (let i = 1; i <= 4; i++) {
            const container = document.getElementById(`q${i}Items`);
            const tasks = this.tasks.filter(t => this.getQuadrant(t) === i);

            // Sort tasks: due date tasks first (chronologically), then others, completed last
            tasks.sort((a, b) => {
                // Completed tasks go to bottom
                if (a.completed && !b.completed) return 1;
                if (!a.completed && b.completed) return -1;

                // Among non-completed tasks
                if (!a.completed && !b.completed) {
                    // Tasks with due dates come first
                    if (a.dueDate && !b.dueDate) return -1;
                    if (!a.dueDate && b.dueDate) return 1;
                    // Both have due dates - sort chronologically
                    if (a.dueDate && b.dueDate) {
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    }
                }

                return 0;
            });

            container.innerHTML = tasks.map(task => this.renderTaskItem(task)).join('');
        }

        // Re-attach event listeners for task items
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openTaskModal(item.dataset.taskId);
            });

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('taskId', item.dataset.taskId);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });
    }

    renderTaskItem(task) {
        const category = this.categories.find(c => c.id === task.category);
        const project = this.projects.find(p => p.id === task.project);

        let metaHtml = '';

        if (task.dueDate) {
            // Parse date in local timezone to avoid off-by-one errors
            const [year, month, day] = task.dueDate.split('-').map(Number);
            const dueDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(dueDate);
            due.setHours(0, 0, 0, 0);
            const isOverdue = due < today && !task.completed;

            metaHtml += `<span class="task-due" style="color: ${isOverdue ? '#ff3b30' : 'inherit'}">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                ${dueDate.toLocaleDateString()}
            </span>`;
        }

        if (category) {
            metaHtml += `<span class="task-tag" style="background: ${category.color}22; color: ${category.color}; border: 1px solid ${category.color}44;">${category.name}</span>`;
        }

        if (project) {
            metaHtml += `<span class="task-tag" style="background: ${project.color}22; color: ${project.color}; border: 1px solid ${project.color}44;">${project.name}</span>`;
        }

        if (task.recurring) {
            metaHtml += `<span class="task-tag" style="background: rgba(108, 99, 255, 0.15); color: #6c63ff; border: 1px solid rgba(108, 99, 255, 0.3);">↻ Recurring</span>`;
        }

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}"
                 data-task-id="${task.id}"
                 draggable="true">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                ${metaHtml ? `<div class="task-meta">${metaHtml}</div>` : ''}
            </div>
        `;
    }

    renderTaskItemForView(task, viewType) {
        const category = this.categories.find(c => c.id === task.category);
        const project = this.projects.find(p => p.id === task.project);

        let metaHtml = '';

        if (task.dueDate) {
            // Parse date in local timezone to avoid off-by-one errors
            const [year, month, day] = task.dueDate.split('-').map(Number);
            const dueDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(dueDate);
            due.setHours(0, 0, 0, 0);
            const isOverdue = due < today && !task.completed;

            metaHtml += `<span class="task-due" style="color: ${isOverdue ? '#ff3b30' : 'inherit'}">
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                ${dueDate.toLocaleDateString()}
            </span>`;
        }

        // Show Urgent/Important tags in category and project views
        if (task.urgent) {
            metaHtml += `<span class="task-tag" style="background: rgba(255, 59, 48, 0.15); color: #ff3b30; border: 1px solid rgba(255, 59, 48, 0.3);">⚡ Urgent</span>`;
        }

        if (task.important) {
            metaHtml += `<span class="task-tag" style="background: rgba(255, 149, 0, 0.15); color: #ff9500; border: 1px solid rgba(255, 149, 0, 0.3);">★ Important</span>`;
        }

        // In category view, show project tag (if exists)
        // In project view, show category tag (if exists)
        if (viewType === 'category' && project) {
            metaHtml += `<span class="task-tag" style="background: ${project.color}22; color: ${project.color}; border: 1px solid ${project.color}44;">${project.name}</span>`;
        } else if (viewType === 'project' && category) {
            metaHtml += `<span class="task-tag" style="background: ${category.color}22; color: ${category.color}; border: 1px solid ${category.color}44;">${category.name}</span>`;
        }

        if (task.recurring) {
            metaHtml += `<span class="task-tag" style="background: rgba(108, 99, 255, 0.15); color: #6c63ff; border: 1px solid rgba(108, 99, 255, 0.3);">↻ Recurring</span>`;
        }

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}"
                 data-task-id="${task.id}">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                ${metaHtml ? `<div class="task-meta">${metaHtml}</div>` : ''}
            </div>
        `;
    }

    renderCategoryView() {
        const container = document.getElementById('categoryView');
        const categoriesWithNone = [{ id: '', name: 'Uncategorized' }, ...this.categories];

        container.innerHTML = categoriesWithNone.map(category => {
            const tasks = this.tasks.filter(t => (t.category || '') === category.id);
            if (tasks.length === 0) return '';

            return `
                <div class="list-section">
                    <h3 style="color: ${category.color || 'var(--text-primary)'}">
                        ${this.escapeHtml(category.name)} (${tasks.length})
                    </h3>
                    <div class="quadrant-items">
                        ${tasks.map(task => this.renderTaskItemForView(task, 'category')).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Re-attach click listeners
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openTaskModal(item.dataset.taskId);
            });
        });
    }

    renderProjectView() {
        const container = document.getElementById('projectView');
        const projectsWithNone = [{ id: '', name: 'No Project' }, ...this.projects];

        container.innerHTML = projectsWithNone.map(project => {
            const tasks = this.tasks.filter(t => (t.project || '') === project.id);
            if (tasks.length === 0) return '';

            return `
                <div class="list-section">
                    <h3 style="color: ${project.color || 'var(--text-primary)'}">
                        ${this.escapeHtml(project.name)} (${tasks.length})
                    </h3>
                    <div class="quadrant-items">
                        ${tasks.map(task => this.renderTaskItemForView(task, 'project')).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // Re-attach click listeners
        document.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openTaskModal(item.dataset.taskId);
            });
        });
    }

    renderCurrentView() {
        if (this.currentView === 'quadrant') {
            this.renderQuadrants();
        } else if (this.currentView === 'category') {
            this.renderCategoryView();
        } else if (this.currentView === 'project') {
            this.renderProjectView();
        }
    }

    // View Management
    setView(view) {
        this.currentView = view;

        // Update button label
        const viewNames = { quadrant: 'Quadrant', category: 'Category', project: 'Project' };
        document.getElementById('viewLabel').textContent = `View: ${viewNames[view]}`;

        // Show/hide views
        document.getElementById('matrixView').style.display = this.currentView === 'quadrant' ? 'grid' : 'none';
        document.getElementById('categoryView').classList.toggle('active', this.currentView === 'category');
        document.getElementById('projectView').classList.toggle('active', this.currentView === 'project');

        this.renderCurrentView();
    }

    // Dropdown Management
    toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const isOpen = dropdown.classList.contains('show');

        // Close all dropdowns first
        this.closeAllDropdowns();

        // Toggle this dropdown
        if (!isOpen) {
            dropdown.classList.add('show');
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-content').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }

    // Import/Export
    exportData() {
        const data = {
            tasks: this.tasks,
            categories: this.categories,
            projects: this.projects,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firstthingsfirst-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (confirm('Import will replace all current data. Continue?')) {
                    this.tasks = data.tasks || [];
                    this.categories = data.categories || [];
                    this.projects = data.projects || [];
                    this.settings = data.settings || this.settings;

                    this.saveData();
                    this.applySettings();
                    this.updateCategoryProjectSelects();
                    this.renderCurrentView();

                    alert('Data imported successfully!');
                }
            } catch (error) {
                alert('Error importing data. Please check the file format.');
                console.error(error);
            }
        };
        reader.readAsText(file);

        // Reset file input
        e.target.value = '';
    }

    // Lists Management
    openListsModal() {
        const modal = document.getElementById('listsModal');
        const modalBody = modal.querySelector('.modal-body');

        // Scroll modal body to top
        if (modalBody) {
            modalBody.scrollTop = 0;
        }

        modal.classList.add('active');
        this.renderCategoriesList();
        this.renderProjectsList();
    }

    closeListsModal() {
        document.getElementById('listsModal').classList.remove('active');
    }

    renderCategoriesList() {
        const container = document.getElementById('categoriesList');
        container.innerHTML = this.categories.map(cat => this.renderListItemRow(cat, 'category')).join('');
        this.attachListItemListeners();
    }

    renderProjectsList() {
        const container = document.getElementById('projectsList');
        container.innerHTML = this.projects.map(proj => this.renderListItemRow(proj, 'project')).join('');
        this.attachListItemListeners();
    }

    renderListItemRow(item, type) {
        const startDate = item.startDate ? new Date(item.startDate).toLocaleDateString() : '';
        const endDate = item.endDate ? new Date(item.endDate).toLocaleDateString() : '';
        const dates = [startDate, endDate].filter(Boolean).join(' - ');

        return `
            <div class="list-item-row" draggable="true" data-item-id="${item.id}" data-item-type="${type}">
                <svg class="drag-handle" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"/>
                </svg>
                <div class="list-item-color" style="background: ${item.color}"></div>
                <div class="list-item-info">
                    <div class="list-item-name">${this.escapeHtml(item.name)}</div>
                    ${dates ? `<div class="list-item-dates">${dates}</div>` : ''}
                </div>
                <button class="btn" data-edit-list="${type}" data-item-id="${item.id}">Edit</button>
                <button class="delete-btn" data-delete-list="${type}" data-item-id="${item.id}">Delete</button>
            </div>
        `;
    }

    attachListItemListeners() {
        document.querySelectorAll('[data-edit-list]').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.editList;
                const id = btn.dataset.itemId;
                this.openListItemModal(type, id);
            });
        });

        document.querySelectorAll('[data-delete-list]').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.deleteList;
                const id = btn.dataset.itemId;
                this.deleteListItem(type, id);
            });
        });

        // Add drag and drop listeners
        document.querySelectorAll('.list-item-row').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', item.innerHTML);
                e.dataTransfer.setData('itemId', item.dataset.itemId);
                e.dataTransfer.setData('itemType', item.dataset.itemType);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('dragging');
                document.querySelectorAll('.list-item-row').forEach(row => {
                    row.classList.remove('drag-over');
                });
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const draggingItem = document.querySelector('.list-item-row.dragging');
                if (draggingItem && draggingItem !== item &&
                    draggingItem.dataset.itemType === item.dataset.itemType) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');

                const draggedId = e.dataTransfer.getData('itemId');
                const draggedType = e.dataTransfer.getData('itemType');
                const targetId = item.dataset.itemId;
                const targetType = item.dataset.itemType;

                // Only allow reordering within the same type
                if (draggedType === targetType && draggedId !== targetId) {
                    this.reorderListItems(draggedType, draggedId, targetId);
                }
            });
        });
    }

    openListItemModal(type, itemId = null) {
        this.editingListItemId = itemId;
        const modal = document.getElementById('listItemModal');
        const modalBody = modal.querySelector('.modal-body');
        const form = document.getElementById('listItemForm');

        // Scroll modal body to top
        if (modalBody) {
            modalBody.scrollTop = 0;
        }

        document.getElementById('listItemType').value = type;
        document.getElementById('listItemModalTitle').textContent =
            itemId ? `Edit ${type === 'category' ? 'Category' : 'Project'}` :
                    `Add ${type === 'category' ? 'Category' : 'Project'}`;

        form.reset();

        if (itemId) {
            const items = type === 'category' ? this.categories : this.projects;
            const item = items.find(i => i.id === itemId);
            if (item) {
                document.getElementById('listItemId').value = item.id;
                document.getElementById('listItemName').value = item.name;
                document.getElementById('listItemColor').value = item.color;
                document.getElementById('listItemColorHex').value = item.color;
                document.getElementById('listItemStartDate').value = item.startDate || '';
                document.getElementById('listItemEndDate').value = item.endDate || '';
            }
        } else {
            const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            document.getElementById('listItemColor').value = randomColor;
            document.getElementById('listItemColorHex').value = randomColor;
        }

        modal.classList.add('active');

        // Focus on name field after modal animation
        setTimeout(() => {
            document.getElementById('listItemName').focus();
        }, 100);
    }

    closeListItemModal() {
        document.getElementById('listItemModal').classList.remove('active');
        this.editingListItemId = null;
    }

    saveListItem(e) {
        e.preventDefault();

        const type = document.getElementById('listItemType').value;
        const item = {
            id: this.editingListItemId || Date.now().toString(),
            name: document.getElementById('listItemName').value.trim(),
            color: document.getElementById('listItemColor').value,
            startDate: document.getElementById('listItemStartDate').value,
            endDate: document.getElementById('listItemEndDate').value
        };

        const items = type === 'category' ? this.categories : this.projects;

        if (this.editingListItemId) {
            const index = items.findIndex(i => i.id === this.editingListItemId);
            items[index] = item;
        } else {
            items.push(item);
        }

        this.saveData();
        this.closeListItemModal();
        this.updateCategoryProjectSelects();

        if (type === 'category') {
            this.renderCategoriesList();
        } else {
            this.renderProjectsList();
        }
    }

    deleteListItem(type, itemId) {
        const itemName = type === 'category' ? 'category' : 'project';
        if (confirm(`Are you sure you want to delete this ${itemName}?`)) {
            if (type === 'category') {
                this.categories = this.categories.filter(c => c.id !== itemId);
                // Remove category from tasks
                this.tasks.forEach(t => {
                    if (t.category === itemId) t.category = '';
                });
            } else {
                this.projects = this.projects.filter(p => p.id !== itemId);
                // Remove project from tasks
                this.tasks.forEach(t => {
                    if (t.project === itemId) t.project = '';
                });
            }

            this.saveData();
            this.updateCategoryProjectSelects();
            this.renderCurrentView();

            if (type === 'category') {
                this.renderCategoriesList();
            } else {
                this.renderProjectsList();
            }
        }
    }

    reorderListItems(type, draggedId, targetId) {
        const items = type === 'category' ? this.categories : this.projects;

        // Find indices
        const draggedIndex = items.findIndex(item => item.id === draggedId);
        const targetIndex = items.findIndex(item => item.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged item and insert at target position
        const [draggedItem] = items.splice(draggedIndex, 1);
        items.splice(targetIndex, 0, draggedItem);

        // Save and re-render
        this.saveData();

        if (type === 'category') {
            this.renderCategoriesList();
        } else {
            this.renderProjectsList();
        }
    }

    updateCategoryProjectSelects() {
        const categorySelect = document.getElementById('taskCategory');
        const projectSelect = document.getElementById('taskProject');

        categorySelect.innerHTML = '<option value="">None</option>' +
            this.categories.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');

        projectSelect.innerHTML = '<option value="">None</option>' +
            this.projects.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('');
    }

    // Settings
    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const modalBody = modal.querySelector('.modal-body');

        // Scroll modal body to top
        if (modalBody) {
            modalBody.scrollTop = 0;
        }

        modal.classList.add('active');

        // Load current settings
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`q${i}Color`).value = this.settings[`q${i}`].color;
            document.getElementById(`q${i}ColorHex`).value = this.settings[`q${i}`].color;
            document.getElementById(`q${i}LabelText`).value = this.settings[`q${i}`].label;
        }
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    saveSettings() {
        for (let i = 1; i <= 4; i++) {
            this.settings[`q${i}`] = {
                color: document.getElementById(`q${i}Color`).value,
                label: document.getElementById(`q${i}LabelText`).value
            };
        }

        this.saveData();
        this.applySettings();
        this.closeSettingsModal();
    }

    resetSettings() {
        if (confirm('Reset all quadrant settings to defaults?')) {
            const currentTheme = this.settings.theme; // Preserve theme
            this.settings = {
                q1: { color: '#AEE7B1', label: 'Do This' },
                q2: { color: '#ABBEE1', label: 'Schedule This' },
                q3: { color: '#BCB5F0', label: 'Assign This' },
                q4: { color: '#F5D26C', label: 'Consider This' },
                theme: currentTheme
            };

            this.saveData();
            this.applySettings();
            this.openSettingsModal(); // Refresh the form
        }
    }

    clearAllData() {
        const confirmed = confirm('⚠️ WARNING: This will permanently delete ALL your data including:\n\n• All tasks\n• All categories\n• All projects\n• All settings\n\nThis action cannot be undone!\n\nAre you sure you want to continue?');

        if (confirmed) {
            const doubleConfirm = confirm('This is your last chance!\n\nClick OK to permanently delete everything, or Cancel to keep your data.');

            if (doubleConfirm) {
                // Clear local storage
                localStorage.removeItem('firstthingsfirst_data');

                // Reset all data in memory
                this.tasks = [];
                this.categories = [];
                this.projects = [];
                this.settings = {
                    q1: { color: '#AEE7B1', label: 'Do This' },
                    q2: { color: '#ABBEE1', label: 'Schedule This' },
                    q3: { color: '#BCB5F0', label: 'Assign This' },
                    q4: { color: '#F5D26C', label: 'Consider This' },
                    theme: 'dark'
                };

                // Update UI
                this.applyTheme();
                this.applySettings();
                this.updateCategoryProjectSelects();
                this.renderCurrentView();
                this.closeSettingsModal();

                alert('✓ All data has been cleared successfully.');
            }
        }
    }

    toggleTheme() {
        this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.updateThemeDropdownButton();
        this.saveData();
    }

    applyTheme() {
        if (this.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    updateThemeDropdownButton() {
        const themeText = document.getElementById('themeTextDropdown');
        const themeIcon = document.getElementById('themeIconDropdown');

        if (this.settings.theme === 'dark') {
            themeText.textContent = 'Switch to Light Theme';
            // Sun icon
            themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
        } else {
            themeText.textContent = 'Switch to Dark Theme';
            // Moon icon
            themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
        }
    }

    updateThemeButton() {
        // Legacy method - kept for compatibility but unused
        this.updateThemeDropdownButton();
    }

    applySettings() {
        const root = document.documentElement;
        for (let i = 1; i <= 4; i++) {
            root.style.setProperty(`--q${i}-color`, this.settings[`q${i}`].color);
            const label = document.getElementById(`q${i}Label`);
            if (label) {
                label.textContent = this.settings[`q${i}`].label;
            }
        }
    }

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDateTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize app
const app = new FirstThingsFirst();

// Register service worker for PWA (only works when served over HTTP/HTTPS)
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Service worker registration failed, but app still works
        });
    });
}
