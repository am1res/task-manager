/*
 * ============================================================
 *  MEMBER 4 — drag.js
 *  Responsibility: Drag-and-drop cards between Kanban columns
 *  Branch: member4-delete-deploy
 *
 *  HOW IT WORKS:
 *  1. Every .task-card on the board gets draggable="true"
 *  2. Each .col-cards zone accepts dropped cards
 *  3. On a successful drop, taskStore.update() changes the
 *     task's status and window.refreshAll() redraws everything
 *
 *  DEPENDENCIES (must load before this file):
 *    tasks.js   → window.taskStore
 *    index.html → window.refreshAll (exposed after DOMContentLoaded)
 * ============================================================
 */

(function () {
  "use strict";

  /* ── State ────────────────────────────────────────────── */
  let draggedId   = null;   // numeric task id being dragged
  let draggedEl   = null;   // the DOM element
  let sourceCol   = null;   // column the drag started from

  /* ── Visual helpers ──────────────────────────────────── */
  const DRAG_OVER_CLASS  = "drag-over";   // highlight drop zone
  const DRAGGING_CLASS   = "is-dragging"; // dim the card being moved

  function injectStyles() {
    if (document.getElementById("drag-styles")) return;
    const s = document.createElement("style");
    s.id = "drag-styles";
    s.textContent = `
      /* Card being dragged */
      .task-card.is-dragging {
        opacity: .45;
        transform: scale(.97) rotate(1.5deg);
        box-shadow: 0 8px 28px rgba(9,30,66,.25) !important;
        cursor: grabbing !important;
      }

      /* Column drop zone highlighted */
      .col-cards.drag-over {
        background: color-mix(in srgb, var(--color-primary) 8%, transparent);
        border-radius: var(--r-lg);
        outline: 2px dashed var(--color-primary);
        outline-offset: -4px;
      }

      /* Make every card show a grab cursor when draggable */
      .task-card[draggable="true"] {
        cursor: grab;
      }

      /* Ghost placeholder shown in the drop zone while dragging */
      .drag-placeholder {
        height: 74px;
        border-radius: var(--r-lg);
        border: 2px dashed var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
        pointer-events: none;
        flex-shrink: 0;
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Make a single card draggable ────────────────────── */
  function makeDraggable(card) {
    if (card.getAttribute("draggable") === "true") return; // already wired
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", (e) => {
      draggedId = Number(card.dataset.id);
      draggedEl = card;
      sourceCol = card.closest(".col-cards");

      // Required: set drag data
      e.dataTransfer.setData("text/plain", String(draggedId));
      e.dataTransfer.effectAllowed = "move";

      // Slight delay so browser captures snapshot BEFORE class is applied
      requestAnimationFrame(() => card.classList.add(DRAGGING_CLASS));
    });

    card.addEventListener("dragend", () => {
      card.classList.remove(DRAGGING_CLASS);
      removePlaceholder();
      draggedId = null;
      draggedEl = null;
      sourceCol = null;
    });
  }

  /* ── Placeholder element ─────────────────────────────── */
  let placeholder = null;

  function getPlaceholder() {
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.className = "drag-placeholder";
      placeholder.setAttribute("aria-hidden", "true");
    }
    return placeholder;
  }
  function removePlaceholder() {
    placeholder?.remove();
  }

  /* ── Wire a column drop zone ─────────────────────────── */
  function wireDropZone(colCards, statusLabel) {
    if (colCards.dataset.dropWired) return;
    colCards.dataset.dropWired = "true";

    colCards.addEventListener("dragover", (e) => {
      if (draggedId === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      colCards.classList.add(DRAG_OVER_CLASS);

      // Insert placeholder before the card under the cursor
      const ph = getPlaceholder();
      const afterEl = getDragAfterElement(colCards, e.clientY);
      if (afterEl) {
        colCards.insertBefore(ph, afterEl);
      } else {
        colCards.appendChild(ph);
      }
    });

    colCards.addEventListener("dragleave", (e) => {
      // Only remove highlight when leaving the column entirely
      if (!colCards.contains(e.relatedTarget)) {
        colCards.classList.remove(DRAG_OVER_CLASS);
        removePlaceholder();
      }
    });

    colCards.addEventListener("drop", (e) => {
      e.preventDefault();
      colCards.classList.remove(DRAG_OVER_CLASS);
      removePlaceholder();

      const id = Number(e.dataTransfer.getData("text/plain"));
      if (!id || !window.taskStore) return;

      const task = window.taskStore.getById(id);
      if (!task) return;

      if (task.status !== statusLabel) {
        // Commit the status change
        window.taskStore.update(id, { status: statusLabel });

        // Refresh all views
        if (typeof window.refreshAll === "function") {
          window.refreshAll();
        } else {
          // Graceful fallback: just re-render board
          if (typeof window.renderTaskList  === "function") window.renderTaskList();
          if (typeof window.renderDashboard === "function") window.renderDashboard();
        }

        // Toast
        if (typeof window.showToast === "function") {
          window.showToast(`"${task.title}" moved to ${statusLabel}`);
        }
      }
    });
  }

  /* ── Utility: find which card the cursor is above ────── */
  function getDragAfterElement(container, y) {
    const draggableEls = [...container.querySelectorAll(".task-card:not(.is-dragging)")];
    return draggableEls.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  /* ── Main init ───────────────────────────────────────── */
  function initDragAndDrop() {
    injectStyles();

    const COLUMNS = [
      { id: "col-Pending",     label: "Pending"     },
      { id: "col-In Progress", label: "In Progress" },
      { id: "col-Done",        label: "Done"        },
    ];

    // Wire each column as a drop zone
    COLUMNS.forEach(({ id, label }) => {
      const colEl = document.getElementById(id);
      if (colEl) wireDropZone(colEl, label);
    });

    // Make all existing cards draggable
    document.querySelectorAll(".col-cards .task-card").forEach(makeDraggable);
  }

  /* ── Re-wire after every board redraw ────────────────── */
  //
  // index.html calls window.refreshAll() after add / edit / delete.
  // We patch it here so drag is re-initialised each time the board
  // re-renders (new card elements are created fresh each render).
  //
  function patchRefreshAll() {
    const original = window.refreshAll;
    if (typeof original !== "function") return;
    window.refreshAll = function (...args) {
      original.apply(this, args);
      // Re-wire after the new DOM is painted
      requestAnimationFrame(initDragAndDrop);
    };
    window._dragPatched = true;
  }

  /* ── Bootstrap ───────────────────────────────────────── */
  function bootstrap() {
    initDragAndDrop();
    if (!window._dragPatched) patchRefreshAll();
  }

  // Run after index.html's DOMContentLoaded has fired
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(bootstrap, 0));
  } else {
    setTimeout(bootstrap, 0);
  }

  // Expose for manual re-init if needed
  window.initDragAndDrop = initDragAndDrop;

})();
