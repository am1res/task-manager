/*
 * ============================================================
 *  MEMBER 4 — delete.js
 *  Responsibility: Delete task + confirmation dialog
 *  Branch: member4-delete-deploy
 *  Depends on: tasks.js, view.js (Members 1 & 2 must load first)
 * ============================================================
 */

// ── Build confirmation dialog once and inject into <body> ─────────────────────
function buildConfirmDialog() {
  if (document.getElementById("confirm-dialog")) return;

  const dialog = document.createElement("div");
  dialog.id = "confirm-dialog";
  dialog.className = "modal-overlay";
  dialog.setAttribute("role", "alertdialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "confirm-title");
  dialog.setAttribute("aria-describedby", "confirm-message");
  dialog.hidden = true;

  dialog.innerHTML = `
    <div class="modal-box modal-box--narrow">
      <div class="modal-header">
        <h2 id="confirm-title">Delete task?</h2>
      </div>
      <p id="confirm-message" class="confirm-message">This action cannot be undone.</p>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button type="button" class="btn btn-danger"    id="confirm-ok">Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeConfirmDialog();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !dialog.hidden) closeConfirmDialog();
  });
}

// ── Show the confirm dialog for a given task ──────────────────────────────────
function confirmDelete(taskId) {
  buildConfirmDialog();

  const task = window.taskStore.getById(taskId);
  if (!task) { window.showToast("Task not found."); return; }

  document.getElementById("confirm-message").textContent =
    `Are you sure you want to delete "${task.title}"? This action cannot be undone.`;

  const dialog = document.getElementById("confirm-dialog");
  dialog.hidden = false;

  // Move focus to cancel button (safer default)
  document.getElementById("confirm-cancel").focus();

  // Wire buttons — clone to remove stale listeners
  const okBtn     = document.getElementById("confirm-ok");
  const cancelBtn = document.getElementById("confirm-cancel");

  const freshOk     = okBtn.cloneNode(true);
  const freshCancel = cancelBtn.cloneNode(true);
  okBtn.replaceWith(freshOk);
  cancelBtn.replaceWith(freshCancel);

  freshOk.addEventListener("click", () => {
    executeDelete(taskId, task.title);
  });

  freshCancel.addEventListener("click", closeConfirmDialog);
}

// ── Perform the deletion ──────────────────────────────────────────────────────
function executeDelete(taskId, taskTitle) {
  window.taskStore.remove(taskId);
  closeConfirmDialog();
  window.renderTaskList();
  window.renderDashboard();
  window.showToast(`Task "${taskTitle}" deleted.`);
}

// ── Close the dialog ──────────────────────────────────────────────────────────
function closeConfirmDialog() {
  const dialog = document.getElementById("confirm-dialog");
  if (dialog) dialog.hidden = true;
}

// Expose for other files (Member 2 wires delete buttons to this)
window.confirmDelete      = confirmDelete;
window.closeConfirmDialog = closeConfirmDialog;
