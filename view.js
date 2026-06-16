/*
 * Member 2 — view.js
 * Responsibility:
 * - render dashboard KPI
 * - render task list
 * - create task cards
 * - search tasks
 * - filter tasks by status
 */
const demoTasks = [
    {
        id: 1,
        title: "Design the homepage layout",
        description: "Create a clean responsive layout for the main page.",
        priority: "High",
        status: "In Progress",
        dueDate: "2026-06-18"
    },
    {
        id: 2,
        title: "Write project README",
        description: "Document setup steps and contribution table.",
        priority: "Medium",
        status: "Pending",
        dueDate: "2026-06-15"
    },
    {
        id: 3,
        title: "Set up GitHub Pages",
        description: "Enable GitHub Pages for project deployment.",
        priority: "High",
        status: "Done",
        dueDate: "2026-06-12"
    },
    {
        id: 4,
        title: "Record demo video",
        description: "Record a short demo of the working task manager.",
        priority: "Low",
        status: "Pending",
        dueDate: "2026-06-17"
    }
];

// This function decides where tasks come from.
// If Member 1 already created window.taskStore, we use it.
// If not, we use demoTasks so our file does not crash.
function getTaskStore() {
    if (
        window.taskStore &&
        typeof window.taskStore.getAll === "function" &&
        typeof window.taskStore.search === "function"
    ) {
        return window.taskStore;
    }

    return {
        getAll: function () {
            return demoTasks;
        },

        search: function (query = "", status = "All") {
            const searchText = query.toLowerCase();

            return demoTasks.filter(function (task) {
                const matchesText =
                    task.title.toLowerCase().includes(searchText) ||
                    task.description.toLowerCase().includes(searchText);

                const matchesStatus =
                    status === "All" || task.status === status;

                return matchesText && matchesStatus;
            });
        }
    };
}

// CSS classes for task status.
const STATUS_CLASS = {
    "Pending": "badge-pending",
    "In Progress": "badge-inprogress",
    "Done": "badge-done"
};

// CSS classes for task priority.
const PRIORITY_CLASS = {
    "Low": "priority-low",
    "Medium": "priority-medium",
    "High": "priority-high"
};

// Creates one task card.
function createTaskCard(task) {
    const article = document.createElement("article");

    article.className = "task-card";
    article.dataset.id = task.id;

    article.innerHTML = `
    <div class="task-card-header">
      <h3 class="task-title">${escapeHTML(task.title)}</h3>

      <span class="badge ${STATUS_CLASS[task.status] || ""}">
        ${escapeHTML(task.status)}
      </span>
    </div>

    <p class="task-desc">${escapeHTML(task.description)}</p>

    <div class="task-meta">
      <span class="priority-chip ${PRIORITY_CLASS[task.priority] || ""}">
        ${escapeHTML(task.priority)}
      </span>

      <span class="due-date">
        Due: ${formatDate(task.dueDate)}
      </span>
    </div>

    <div class="task-actions">
      <button class="btn btn-edit" data-id="${task.id}">
        Edit
      </button>

      <button class="btn btn-delete" data-id="${task.id}">
        Delete
      </button>
    </div>
  `;

    return article;
}

// Renders task list.
function renderTaskList(query = "", status = "All") {
    const container = document.getElementById("task-list");

    if (!container) {
        return;
    }

    const store = getTaskStore();
    const tasks = store.search(query, status);

    container.innerHTML = "";

    if (tasks.length === 0) {
        container.innerHTML = `
      <div class="empty-state">
        <h3>No tasks found</h3>
        <p>Try another search or filter.</p>
      </div>
    `;

        return;
    }

    tasks.forEach(function (task) {
        const taskCard = createTaskCard(task);
        container.appendChild(taskCard);
    });

    connectTaskButtons();
}

// Connects Edit and Delete buttons.
// Edit will be handled by Member 3.
// Delete will be handled by Member 4.
function connectTaskButtons() {
    const editButtons = document.querySelectorAll(".btn-edit");

    editButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const taskId = Number(button.dataset.id);

            if (typeof window.openEditModal === "function") {
                window.openEditModal(taskId);
            } else {
                console.log("Edit function is not ready yet. Task id:", taskId);
            }
        });
    });

    const deleteButtons = document.querySelectorAll(".btn-delete");

    deleteButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const taskId = Number(button.dataset.id);

            if (typeof window.confirmDelete === "function") {
                window.confirmDelete(taskId);
            } else {
                console.log("Delete function is not ready yet. Task id:", taskId);
            }
        });
    });
}

// Renders dashboard KPI.
function renderDashboard() {
    const container = document.getElementById("dashboard-kpis");

    if (!container) {
        return;
    }

    const store = getTaskStore();
    const tasks = store.getAll();

    const total = tasks.length;

    const completed = tasks.filter(function (task) {
        return task.status === "Done";
    }).length;

    const inProgress = tasks.filter(function (task) {
        return task.status === "In Progress";
    }).length;

    const pending = tasks.filter(function (task) {
        return task.status === "Pending";
    }).length;

    container.innerHTML = `
    <article class="kpi-card">
      <span class="kpi-label">Total tasks</span>
      <span class="kpi-value">${total}</span>
      <span class="kpi-meta">All tasks</span>
    </article>

    <article class="kpi-card">
      <span class="kpi-label">Completed</span>
      <span class="kpi-value">${completed}</span>
      <span class="kpi-meta">Done</span>
    </article>

    <article class="kpi-card">
      <span class="kpi-label">In progress</span>
      <span class="kpi-value">${inProgress}</span>
      <span class="kpi-meta">Active now</span>
    </article>

    <article class="kpi-card">
      <span class="kpi-label">Pending</span>
      <span class="kpi-value">${pending}</span>
      <span class="kpi-meta">Not started</span>
    </article>
  `;
}

// Initializes search input and status filter.
function initSearchAndFilter() {
    const searchInput = document.getElementById("search-input");
    const statusFilter = document.getElementById("status-filter");

    if (!searchInput && !statusFilter) {
        return;
    }

    function refreshTaskList() {
        const query = searchInput ? searchInput.value.trim() : "";
        const status = statusFilter ? statusFilter.value : "All";

        renderTaskList(query, status);
    }

    if (searchInput) {
        searchInput.addEventListener("input", refreshTaskList);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", refreshTaskList);
    }
}

// Protects HTML from unsafe user input.
function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, function (character) {
        const symbols = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return symbols[character];
    });
}

// Formats date.
function formatDate(dateString) {
    if (!dateString) {
        return "—";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Make functions available for other members.
window.renderTaskList = renderTaskList;
window.renderDashboard = renderDashboard;
window.createTaskCard = createTaskCard;
window.initSearchAndFilter = initSearchAndFilter;
window.escapeHTML = escapeHTML;
window.formatDate = formatDate;