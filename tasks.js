/*
 * ============================================================
 *  MEMBER 1 — tasks.js
 *  Responsibility: Add task feature (create + in-memory store)
 *  Branch: member1-create
 * ============================================================
 */

// ── Shared in-memory task store ──────────────────────────────────────────────
const taskStore = (() => {
  let tasks = [
    { id: 1, title: "Design the homepage layout", description: "Create a clean, responsive layout for the main page.", priority: "High", status: "In Progress", dueDate: "2026-06-18" },
    { id: 2, title: "Write project README",       description: "Document setup steps and contribution table.",         priority: "Medium", status: "Pending",     dueDate: "2026-06-15" },
    { id: 3, title: "Set up GitHub Pages",         description: "Enable Pages and push the deployment workflow.",       priority: "High",   status: "Done",        dueDate: "2026-06-12" },
    { id: 4, title: "Record the demo video",       description: "Screen-record the working project features.",          priority: "Low",    status: "Pending",     dueDate: "2026-06-17" },
  ];
  let nextId = 5;

  return {
    getAll:    ()         => [...tasks],
    getById:   (id)       => tasks.find(t => t.id === id) || null,
    add:       (task)     => { const t = { ...task, id: nextId++ }; tasks.push(t); return t; },
    update:    (id, data) => {
      const i = tasks.findIndex(t => t.id === id);
      if (i === -1) return null;
      tasks[i] = { ...tasks[i], ...data };
      return tasks[i];
    },
    remove:    (id)       => { tasks = tasks.filter(t => t.id !== id); },
    search:    (query, status) => tasks.filter(t => {
      const matchText   = !query  || t.title.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase());
      const matchStatus = !status || status === "All" || t.status === status;
      return matchText && matchStatus;
    }),
  };
})();

// ── Validation helpers ────────────────────────────────────────────────────────
function validateTask({ title, description, priority, dueDate }) {
  const errors = {};
  if (!title || title.trim().length < 3)       errors.title       = "Title must be at least 3 characters.";
  if (!description || description.trim() === "") errors.description = "Description is required.";
  if (!["Low","Medium","High"].includes(priority)) errors.priority = "Select a valid priority.";
  if (!dueDate)                                  errors.dueDate    = "Due date is required.";
  else if (new Date(dueDate) < new Date(new Date().toDateString())) errors.dueDate = "Due date cannot be in the past.";
  return errors;
}

// ── Render inline validation error ───────────────────────────────────────────
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  let err = field.parentElement.querySelector(".field-error");
  if (!err) {
    err = document.createElement("p");
    err.className = "field-error";
    err.setAttribute("role", "alert");
    field.parentElement.appendChild(err);
  }
  err.textContent = message;
  field.setAttribute("aria-invalid", "true");
}

function clearErrors(formEl) {
  formEl.querySelectorAll(".field-error").forEach(el => el.remove());
  formEl.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
}

// ── Wire up the add-task form ─────────────────────────────────────────────────
function initAddTaskForm() {
  const form = document.getElementById("add-task-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(form);

    const data = {
      title:       form.querySelector("#task-title").value.trim(),
      description: form.querySelector("#task-desc").value.trim(),
      priority:    form.querySelector("#task-priority").value,
      dueDate:     form.querySelector("#task-due").value,
      status:      "Pending",
    };

    const errors = validateTask(data);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, msg]) => {
        showError("task-" + field, msg);
      });
      return;
    }

    const newTask = taskStore.add(data);
    form.reset();
    renderTaskList();
    renderDashboard();
    showToast(`Task "${newTask.title}" created successfully.`);
    document.getElementById("tasks-section")?.scrollIntoView({ behavior: "smooth" });
  });
}

// ── Simple toast notification ─────────────────────────────────────────────────
function showToast(message) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 400); }, 3000);
}

// Expose for other members' files
window.taskStore    = taskStore;
window.validateTask = validateTask;
window.showToast    = showToast;
window.clearErrors  = clearErrors;
window.showError    = showError;
window.initAddTaskForm = initAddTaskForm;
