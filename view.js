/*
 *  MEMBER 2 — view.js
 *  Responsibility: View tasks + search/filter feature
 *  Branch: member2-view-search
 */

(function () {
    "use strict";
    const STATUS_CLASS = {
        "Pending": "badge-pending",
        "In Progress": "badge-inprogress",
        "Done": "badge-done"
    };

    const PRIORITY_CLASS = {
        "Low": "priority-low",
        "Medium": "priority-medium",
        "High": "priority-high"
    };

    function getTaskStore() {
        if (!window.taskStore) {
            console.error("window.taskStore is not available. Make sure tasks.js is loaded before view.js.");
            return null;
        }

        return window.taskStore;
    }

    function getCurrentSearchQuery() {
        const searchInput = document.getElementById("search-input");
        return searchInput ? searchInput.value.trim() : "";
    }

    function getCurrentStatusFilter() {
        const statusFilter = document.getElementById("status-filter");
        return statusFilter ? statusFilter.value : "All";
    }

    function getAllTasks() {
        const store = getTaskStore();

        if (!store || typeof store.getAll !== "function") {
            return [];
        }

        return store.getAll();
    }

    function getFilteredTasks(query = "", status = "All") {
        const store = getTaskStore();

        if (!store) {
            return [];
        }

        if (typeof store.search === "function") {
            return store.search(query, status);
        }

        return getAllTasks().filter(function (task) {
            const title = task.title || "";
            const description = task.description || "";
            const taskStatus = task.status || "";

            const matchesText =
                !query ||
                title.toLowerCase().includes(query.toLowerCase()) ||
                description.toLowerCase().includes(query.toLowerCase());

            const matchesStatus =
                !status ||
                status === "All" ||
                taskStatus === status;

            return matchesText && matchesStatus;
        });
    }

    function createTaskCard(task) {
        const article = document.createElement("article");

        const title = task.title || "Untitled task";
        const description = task.description || "";
        const status = task.status || "Pending";
        const priority = task.priority || "Medium";
        const dueDate = task.dueDate || "";

        article.className = "task-card";
        article.dataset.id = task.id;
        article.setAttribute("aria-label", `Task: ${title}`);

        article.innerHTML = `
      <div class="task-card-header">
        <h3 class="task-title">${escapeHTML(title)}</h3>

        <span class="badge ${STATUS_CLASS[status] || ""}">
          ${escapeHTML(status)}
        </span>
      </div>

      <p class="task-desc">${escapeHTML(description)}</p>

      <div class="task-meta">
        <span class="priority-chip ${PRIORITY_CLASS[priority] || ""}">
          ${escapeHTML(priority)}
        </span>

        <span class="due-date">
          Due: ${formatDate(dueDate)}
        </span>
      </div>

      <div class="task-actions">
        <button class="btn btn-edit" data-id="${task.id}" aria-label="Edit ${escapeHTML(title)}">
          Edit
        </button>

        <button class="btn btn-delete" data-id="${task.id}" aria-label="Delete ${escapeHTML(title)}">
          Delete
        </button>
      </div>
    `;

        return article;
    }

    function renderTaskList(query, status) {
        const container = document.getElementById("task-list");

        if (!container) {
            console.error("Element #task-list not found in index.html.");
            return;
        }

        const finalQuery = query !== undefined ? query : getCurrentSearchQuery();
        const finalStatus = status !== undefined ? status : getCurrentStatusFilter();

        const tasks = getFilteredTasks(finalQuery, finalStatus);

        container.innerHTML = "";

        if (tasks.length === 0) {
            container.innerHTML = `
        <div class="empty-state" role="status">
          <div class="empty-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <path d="M9 12h6M9 16h4"/>
            </svg>
          </div>

          <h3>No tasks found</h3>

          <p>
            ${
                finalQuery || finalStatus !== "All"
                    ? "Try a different search or filter."
                    : "Add your first task using the form above."
            }
          </p>
        </div>
      `;

            return;
        }

        tasks.forEach(function (task) {
            const taskCard = createTaskCard(task);
            container.appendChild(taskCard);
        });

        connectTaskButtons(container);
    }

    function connectTaskButtons(container) {
        const editButtons = container.querySelectorAll(".btn-edit");

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

        const deleteButtons = container.querySelectorAll(".btn-delete");

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

    function renderDashboard() {
        const container = document.getElementById("dashboard-kpis");

        if (!container) {
            console.error("Element #dashboard-kpis not found in index.html.");
            return;
        }

        const tasks = getAllTasks();

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

        const kpis = [
            {
                label: "Total tasks",
                value: total,
                meta: "All tasks"
            },
            {
                label: "Completed",
                value: completed,
                meta: "Done"
            },
            {
                label: "In progress",
                value: inProgress,
                meta: "Active now"
            },
            {
                label: "Pending",
                value: pending,
                meta: "Not started"
            }
        ];

        container.innerHTML = kpis.map(function (kpi) {
            return `
        <article class="kpi-card">
          <span class="kpi-label">${escapeHTML(kpi.label)}</span>
          <span class="kpi-value">${kpi.value}</span>
          <span class="kpi-meta">${escapeHTML(kpi.meta)}</span>
        </article>
      `;
        }).join("");
    }

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

    function formatDate(dateString) {
        if (!dateString) {
            return "—";
        }

        const date = new Date(dateString + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    window.renderTaskList = renderTaskList;
    window.renderDashboard = renderDashboard;
    window.createTaskCard = createTaskCard;
    window.initSearchAndFilter = initSearchAndFilter;
    window.escapeHTML = escapeHTML;
    window.formatDate = formatDate;
})();