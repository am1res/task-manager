/*
 * ============================================================
 *  MEMBER 3 — edit.js
 *  Responsibility: Edit task feature (modal + form + update)
 * ============================================================
 */

function buildEditModal() {
  if (document.getElementById("edit-modal")) return;

  const overlay = document.createElement("div");
  overlay.id = "edit-modal";
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "edit-modal-title");
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h2 id="edit-modal-title">Edit task</h2>
        <button class="modal-close" id="edit-close-btn" aria-label="Close edit modal">&times;</button>
      </div>
      <form id="edit-task-form" novalidate>
        <input type="hidden" id="edit-task-id" />
        <div class="form-group">
          <label for="edit-title">Task title</label>
          <input id="edit-title" type="text" placeholder="Task title" autocomplete="off" />
          <span class="field-error" id="edit-title-error"></span>
        </div>
        <div class="form-group">
          <label for="edit-desc">Description</label>
          <textarea id="edit-desc" rows="3" placeholder="Task description"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="edit-priority">Priority</label>
            <select id="edit-priority">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-status">Status</label>
            <select id="edit-status">
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="edit-due">Due date</label>
          <input id="edit-due" type="date" />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="edit-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeEditModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeEditModal();
  });

  document.getElementById("edit-close-btn")?.addEventListener("click", closeEditModal);
  document.getElementById("edit-cancel-btn")?.addEventListener("click", closeEditModal);
}

function openEditModal(taskId) {
  buildEditModal();

  const task = window.taskStore ? window.taskStore.getById(taskId) : null;
  if (!task) {
    if (typeof window.showToast === 'function') window.showToast("Task not found.");
    return;
  }

  document.getElementById("edit-task-id").value  = task.id;
  document.getElementById("edit-title").value     = task.title || "";
  document.getElementById("edit-desc").value      = task.description || "";
  document.getElementById("edit-due").value       = task.dueDate || "";

  // Set priority select — match exact value
  const priorityEl = document.getElementById("edit-priority");
  priorityEl.value = task.priority || "Medium";
  if (!priorityEl.value) priorityEl.selectedIndex = 1; // fallback Medium

  // Set status select — normalize legacy "Pending" → "To Do"
  const statusEl = document.getElementById("edit-status");
  const normalizedStatus = (task.status === "Pending") ? "To Do" : (task.status || "To Do");
  statusEl.value = normalizedStatus;
  if (!statusEl.value) statusEl.selectedIndex = 0;

  const modal = document.getElementById("edit-modal");
  modal.hidden = false;
  document.getElementById("edit-title").focus();

  // Replace form node to clear any old listeners
  const form = document.getElementById("edit-task-form");
  const freshForm = form.cloneNode(true);
  form.replaceWith(freshForm);
  freshForm.addEventListener("submit", handleEditSubmit);

  document.getElementById("edit-close-btn")?.addEventListener("click", closeEditModal);
  document.getElementById("edit-cancel-btn")?.addEventListener("click", closeEditModal);
}

function handleEditSubmit(e) {
  e.preventDefault();

  const id   = Number(document.getElementById("edit-task-id").value);
  const title = document.getElementById("edit-title").value.trim();

  // Simple title validation
  const titleError = document.getElementById("edit-title-error");
  if (!title) {
    if (titleError) { titleError.textContent = "Title is required."; }
    document.getElementById("edit-title").focus();
    return;
  }
  if (titleError) titleError.textContent = "";

  const data = {
    title,
    description: document.getElementById("edit-desc").value.trim(),
    priority:    document.getElementById("edit-priority").value,
    dueDate:     document.getElementById("edit-due").value,
    status:      document.getElementById("edit-status").value,
  };

  // Update via taskStore if available, otherwise fall back to window.updateTask
  if (window.taskStore && typeof window.taskStore.update === 'function') {
    window.taskStore.update(id, data);
  } else if (typeof window.updateTask === 'function') {
    window.updateTask(id, data);
  }

  closeEditModal();

  // Refresh all views
  if (typeof window.refreshAll === 'function') window.refreshAll();
  else {
    if (typeof window.renderTaskList  === 'function') window.renderTaskList();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
  }

  if (typeof window.showToast === 'function') window.showToast(`Task "${data.title}" updated.`);
}

function closeEditModal() {
  const modal = document.getElementById("edit-modal");
  if (modal) modal.hidden = true;
}

window.openEditModal  = openEditModal;
window.closeEditModal = closeEditModal;
