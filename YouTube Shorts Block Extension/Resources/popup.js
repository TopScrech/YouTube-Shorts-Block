const STORAGE_KEY = "enabled";
const DEFAULT_ENABLED = true;

const toggle = document.getElementById("enabled-toggle");
const statusText = document.getElementById("status-text");

const storage = (() => {
    try {
        return typeof browser !== "undefined" && browser.storage && browser.storage.local ? browser.storage.local : null;
    } catch (error) {
        return null;
    }
})();

const setStatus = (enabled) => {
    toggle.checked = enabled;
    statusText.textContent = enabled ? "Blocking is on." : "Blocking is off.";
};

const loadState = async () => {
    if (!storage) {
        setStatus(DEFAULT_ENABLED);
        return;
    }
    try {
        const result = await storage.get({ [STORAGE_KEY]: DEFAULT_ENABLED });
        setStatus(result[STORAGE_KEY] !== false);
    } catch (error) {
        setStatus(DEFAULT_ENABLED);
    }
};

toggle.addEventListener("change", async () => {
    const enabled = toggle.checked;
    setStatus(enabled);
    if (!storage) return;
    try {
        await storage.set({ [STORAGE_KEY]: enabled });
    } catch (error) {
        // Ignore storage errors in the popup.
    }
});

loadState();
