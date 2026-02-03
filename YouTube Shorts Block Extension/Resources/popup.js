const STORAGE_KEY = "enabled";
const DEFAULT_ENABLED = true;
const PLAYLIST_STORAGE_KEY = "playlistButtonEnabled";
const DEFAULT_PLAYLIST_ENABLED = true;
const LIKES_STORAGE_KEY = "hideLikesDislikes";
const DEFAULT_LIKES_HIDDEN = false;

const toggle = document.getElementById("enabled-toggle");
const playlistToggle = document.getElementById("playlist-toggle");
const likesToggle = document.getElementById("likes-toggle");

const storage = (() => {
    try {
        return typeof browser !== "undefined" && browser.storage && browser.storage.local ? browser.storage.local : null;
    } catch (error) {
        return null;
    }
})();

const setStatus = (enabled) => {
    toggle.checked = enabled;
};

const setPlaylistStatus = (enabled) => {
    playlistToggle.checked = enabled;
};

const setLikesStatus = (hidden) => {
    likesToggle.checked = hidden;
};

const loadState = async () => {
    if (!storage) {
        setStatus(DEFAULT_ENABLED);
        setPlaylistStatus(DEFAULT_PLAYLIST_ENABLED);
        setLikesStatus(DEFAULT_LIKES_HIDDEN);
        return;
    }
    try {
        const result = await storage.get({
            [STORAGE_KEY]: DEFAULT_ENABLED,
            [PLAYLIST_STORAGE_KEY]: DEFAULT_PLAYLIST_ENABLED,
            [LIKES_STORAGE_KEY]: DEFAULT_LIKES_HIDDEN
        });
        setStatus(result[STORAGE_KEY] !== false);
        setPlaylistStatus(result[PLAYLIST_STORAGE_KEY] !== false);
        setLikesStatus(result[LIKES_STORAGE_KEY] === true);
    } catch (error) {
        setStatus(DEFAULT_ENABLED);
        setPlaylistStatus(DEFAULT_PLAYLIST_ENABLED);
        setLikesStatus(DEFAULT_LIKES_HIDDEN);
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

playlistToggle.addEventListener("change", async () => {
    const enabled = playlistToggle.checked;
    setPlaylistStatus(enabled);
    if (!storage) return;
    try {
        await storage.set({ [PLAYLIST_STORAGE_KEY]: enabled });
    } catch (error) {
        // Ignore storage errors in the popup.
    }
});

likesToggle.addEventListener("change", async () => {
    const hidden = likesToggle.checked;
    setLikesStatus(hidden);
    if (!storage) return;
    try {
        await storage.set({ [LIKES_STORAGE_KEY]: hidden });
    } catch (error) {
        // Ignore storage errors in the popup.
    }
});

loadState();
