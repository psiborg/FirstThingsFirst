# FirstThingsFirst - Eisenhower Matrix Task Manager

A progressive web app for managing tasks using the Eisenhower Matrix prioritization method.

## Features

### Quadrant-Based Organization
Tasks are organized into four quadrants based on urgency and importance:
- **Q1 (Urgent & Important)**: Do This - Tasks requiring immediate attention
- **Q2 (Less Urgent & Important)**: Schedule This - Important tasks to plan for
- **Q3 (Urgent & Less Important)**: Delegate This - Tasks to delegate or handle quickly
- **Q4 (Less Urgent & Less Important)**: Consider This - Tasks to evaluate and plan for later

### Task Management
- **Add Tasks**: Create tasks with title, notes (Markdown), due dates, categories, and projects
- **Drag & Drop**: Move tasks between quadrants to update their priority
- **Due Dates**: Tasks with due dates appear at the top in chronological order
- **Completed Tasks**: Mark tasks as complete (shown with strikethrough at bottom)
- **Recurring Tasks**: Mark tasks as recurring
- **Task History**: Automatic tracking of created, modified, and completed dates
  - Created Date: When the task was first created
  - Modified Date: When the task was last updated
  - Completed Date: When the task was marked as completed (only shown if completed)

### User Interface
- **Compact Layout**: Quadrants fill the screen with scrollable task lists
- **Logo**: Custom 2×2 matrix logo representing the four quadrants
- **Modal Forms**: Fixed headers and footers with scrollable content
- **Auto-focus**: First field automatically focused when opening forms
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Organization
- **Categories**: Create custom categories with colors
- **Projects**: Organize tasks by project with custom colors and date ranges
- **Multiple Views**: Toggle between Quadrant, Category, and Project views

### Data Management
- **Local Storage**: All data saved automatically to browser storage
- **Export**: Download all data as JSON file
- **Import**: Import data from exported JSON file
- **Offline Support**: Works offline as a Progressive Web App

### Customization
- **Quadrant Settings**: Customize colors and labels for each quadrant
- **Custom Categories/Projects**: Create unlimited categories and projects with custom colors

## How to Use

1. **Open index.html** in a modern web browser
2. **Add a Task**: Click the "Add" button and fill in the task details
3. **Organize**: Tasks automatically appear in the appropriate quadrant based on Urgent/Important checkboxes
4. **Move Tasks**: Drag and drop tasks between quadrants to reprioritize
5. **View Options**: Toggle between Quadrant, Category, and Project views
6. **Export/Import**: Back up your data or transfer between devices

## Task Date Tracking

Every task automatically tracks:
- **Created Date**: Set when you first create the task
- **Modified Date**: Updated each time you edit and save the task
- **Completed Date**: Set when you mark the task as completed

These dates are read-only and provide a complete audit trail of your task history. The dates are displayed at the bottom of the edit task form for existing tasks.

## Technical Details

- **No Dependencies**: Pure HTML, CSS, and JavaScript
- **Progressive Web App**: Installable on mobile devices and works offline
- **LocalStorage**: All data persisted in browser storage
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Compact Interface**: Screen-filling quadrants with scrollable content

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- CSS Grid
- LocalStorage
- Service Workers (for PWA features)

## Installation as PWA

1. Open the app in Chrome, Edge, or Safari
2. Look for the "Install" prompt in the address bar
3. Click "Install" to add to your home screen/desktop
4. Launch like a native app

## Privacy

All data is stored locally in your browser. No data is sent to any server. Your tasks and notes remain completely private.
