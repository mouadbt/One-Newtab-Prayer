import { renderTask } from './ui.js';
import { loadData, saveData, toggleClassName } from './utils.js';

// Define the tasks list
let tasks = [];

export const initTasks = (icons) => {

    // get the Todo Items
    tasks = loadData('tasks', [
        {
            "id": "taskItem1",
            "text": "Your first task",
            "done": false
        }
    ]);

    // Get the delete svg icon
    const deleteSvgIcon = icons?.close?.content;

    // Render TodoItems
    tasks.forEach((task) => {
        renderTask(task, deleteSvgIcon);
    });

    // Initialize tasks events 
    initTaskEvents();
}

// 
export const initTaskEvents = () => {
    const taskCollection = document.querySelector('#task-collection');
    if (!taskCollection) return;
    taskCollection.addEventListener('click', (e) => {

        // We ehck if the element that trigger the event is not the checkbox we want then just quit so we are sure the element we handle the event for is our checkbox not another element
        const removeBtn = e.target.closest('.task-remove-action');
        if (!removeBtn) return;

        const id = removeBtn.dataset.remove;
        removeTask(id);
    });

    taskCollection.addEventListener('change', (e) => {

        // same logic of remove button applies here
        if (!e.target.classList.contains('task-toggle-box')) return;
        const checkbox = e.target;
        const id = checkbox.id;
        updateTask(id, checkbox);
    });
}

// Add new Task
export const handleAddNewTask = (taskInput) => {
    addNewTask(taskInput)
}

// Add a new task
export const addNewTask = (taskInput) => {
    const taskContent = taskInput.value.trim();
    if (!taskContent) return;
    const id = "taskItem" + Date.now();
    const task = { id, text: taskContent, done: false }
    tasks.push(task);
    saveData('tasks', tasks);
    renderTask(task);
    taskInput.value = '';
}

// Remove a taks
const removeTask = (id) => {
    const taskEntry = document.querySelector(`.task-entry[data-id="${id}"]`);
    if (!taskEntry) return;

    toggleClassName(taskEntry, 'task-fade-out', 'add');

    setTimeout(() => {
        taskEntry.remove();
        tasks = tasks.filter((t) => t.id !== id);
        saveData('tasks', tasks);
    }, 300);

}

// Update a task
const updateTask = (id, el) => {
    const taskIndex = tasks.findIndex((task) => task.id === id);
    if (taskIndex !== -1) {
        tasks[taskIndex].done = el.checked;
        saveData('tasks', tasks);
    }
    if (el.checked) {
    }
}