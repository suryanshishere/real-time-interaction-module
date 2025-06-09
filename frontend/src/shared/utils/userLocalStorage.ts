const STORAGE_KEY = "app_user_state";

export function updateDeactivatedAt(deactivatedAt: string | null) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const userState = stored ? JSON.parse(stored) : {};
    userState.deactivated_at = deactivatedAt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userState));
  } catch (e) {
    console.error("Error updating deactivated_at in localStorage", e);
  }
}
