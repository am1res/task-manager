/*
 * ============================================================
 *  MEMBER 3 — edit.js
 *  Responsibility: Edit task feature (modal + form + update)
 *  Branch: member3-edit
 *  Depends on: tasks.js, view.js (Members 1 & 2 must load first)
 * ============================================================
 */

// ── Build modal HTML once and inject into <body> ──────────────────────────────
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
        </div>
        <div class="form-group">
          <label for="edit-desc">Description</label>
          <textarea id="edit-desc" rows="3" placeholder="Task description"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="edit-priority">Priority</label>
            <select id="edit-priority">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-status">Status</label>
            <select id="edit-status">
              <option>Pending</option>
              <option>In Progress</option>
              <option>Done</option>
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

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeEditModal();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !overlay.hidden) closeEditModal();
    });

    document.getElementById("edit-close-btn")?.addEventListener("click", closeEditModal);
    document.getElementById("edit-cancel-btn")?.addEventListener("click", closeEditModal);
}

// ── Open modal and pre-fill with task data ────────────────────────────────────
function openEditModal(taskId) {
    buildEditModal();

    const task = window.taskStore.getById(taskId);
    if (!task) { window.showToast("Task not found."); return; }

    document.getElementById("edit-task-id").value  = task.id;
    document.getElementById("edit-title").value     = task.title;
    document.getElementById("edit-desc").value      = task.description;
    document.getElementById("edit-priority").value  = task.priority;
    document.getElementById("edit-status").value    = task.status;
    document.getElementById("edit-due").value       = task.dueDate;

    const modal = document.getElementById("edit-modal");
    modal.hidden = false;
    document.getElementById("edit-title").focus();

    // Wire submit (remove old listener first to prevent duplicates)
    const form = document.getElementById("edit-task-form");
    const freshForm = form.cloneNode(true);
    form.replaceWith(freshForm);
    freshForm.addEventListener("submit", handleEditSubmit);

    // Re-attach close buttons after cloneNode
    document.getElementById("edit-close-btn")?.addEventListener("click", closeEditModal);
    document.getElementById("edit-cancel-btn")?.addEventListener("click", closeEditModal);
}

// ── Handle edit form submission ───────────────────────────────────────────────
function handleEditSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    window.clearErrors(form);

    const id   = Number(document.getElementById("edit-task-id").value);
    const data = {
        title:       document.getElementById("edit-title").value.trim(),
        description: document.getElementById("edit-desc").value.trim(),
        priority:    document.getElementById("edit-priority").value,
        dueDate:     document.getElementById("edit-due").value,
        status:      document.getElementById("edit-status").value,
    };

    // Reuse Member 1's validation for title, description, priority, dueDate
    const { status: _s, ...toValidate } = data;
    const errors = window.validateTask(toValidate);
    if (Object.keys(errors).length) {
        Object.entries(errors).forEach(([field, msg]) => window.showError("edit-" + field, msg));
        return;
    }

    window.taskStore.update(id, data);
    closeEditModal();
    window.renderTaskList();
    window.renderDashboard();
    window.showToast(`Task "${data.title}" updated.`);
}

// ── Close the modal ───────────────────────────────────────────────────────────
function closeEditModal() {
    const modal = document.getElementById("edit-modal");
    if (modal) modal.hidden = true;
}

// Expose for other files (Member 2 wires edit buttons to this)
window.openEditModal  = openEditModal;
window.closeEditModal = closeEditModal;
