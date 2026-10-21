// Messages and confirmations for every screen. Screens call these functions; <ToastHost />
// (in ui.js) shows them, so the web and the phone look the same (Alert does nothing on the web).
const listeners = new Set();
let nextId = 1;

const emit = (event) => listeners.forEach((listener) => listener(event));

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const showSuccess = (message) =>
  emit({ type: "toast", id: nextId++, kind: "success", message });

export const showError = (message) =>
  emit({ type: "toast", id: nextId++, kind: "error", message });

// Resolves true when the user confirms.
export const confirmAction = (title, message, confirmLabel) =>
  new Promise((resolve) =>
    emit({ type: "confirm", id: nextId++, title, message, confirmLabel, resolve })
  );
