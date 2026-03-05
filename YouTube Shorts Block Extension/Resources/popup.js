const STORAGE_KEY = "enabled";
const DEFAULT_ENABLED = true;
const PLAYLIST_STORAGE_KEY = "playlistButtonEnabled";
const DEFAULT_PLAYLIST_ENABLED = true;
const LIKES_STORAGE_KEY = "hideLikesDislikes";
const DEFAULT_LIKES_HIDDEN = false;
const LIKE_COUNT_STORAGE_KEY = "hideLikeCount";
const DEFAULT_LIKE_COUNT_HIDDEN = false;
const COMMENTS_STORAGE_KEY = "hideComments";
const DEFAULT_COMMENTS_HIDDEN = false;
const SUBSCRIBER_COUNT_STORAGE_KEY = "hideSubscriberCount";
const DEFAULT_SUBSCRIBER_COUNT_HIDDEN = false;

const isIOS = () => {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    return /iPad|iPhone|iPod/i.test(ua) || (platform === "MacIntel" && maxTouchPoints > 1);
};

const subscriberCountSupported = !isIOS();
const subscriberCountRow = document.getElementById("subscriber-count-row");
if (!subscriberCountSupported && subscriberCountRow) {
    subscriberCountRow.remove();
}

const toggle = document.getElementById("enabled-toggle");
const playlistToggle = document.getElementById("playlist-toggle");
const likesToggle = document.getElementById("likes-toggle");
const likeCountToggle = document.getElementById("like-count-toggle");
const commentsToggle = document.getElementById("comments-toggle");
const subscriberCountToggle = subscriberCountSupported ? document.getElementById("subscriber-count-toggle") : null;

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

const setLikeCountStatus = (hidden) => {
    likeCountToggle.checked = hidden;
};

const setCommentsStatus = (hidden) => {
    commentsToggle.checked = hidden;
};

const setSubscriberCountStatus = (hidden) => {
    if (!subscriberCountToggle) return;
    subscriberCountToggle.checked = hidden;
};

const loadState = async () => {
    if (!storage) {
        setStatus(DEFAULT_ENABLED);
        setPlaylistStatus(DEFAULT_PLAYLIST_ENABLED);
        setLikesStatus(DEFAULT_LIKES_HIDDEN);
        setLikeCountStatus(DEFAULT_LIKE_COUNT_HIDDEN);
        setCommentsStatus(DEFAULT_COMMENTS_HIDDEN);
        if (subscriberCountSupported) {
            setSubscriberCountStatus(DEFAULT_SUBSCRIBER_COUNT_HIDDEN);
        }
        return;
    }
    try {
        const defaults = {
            [STORAGE_KEY]: DEFAULT_ENABLED,
            [PLAYLIST_STORAGE_KEY]: DEFAULT_PLAYLIST_ENABLED,
            [LIKES_STORAGE_KEY]: DEFAULT_LIKES_HIDDEN,
            [LIKE_COUNT_STORAGE_KEY]: DEFAULT_LIKE_COUNT_HIDDEN,
            [COMMENTS_STORAGE_KEY]: DEFAULT_COMMENTS_HIDDEN
        };
        if (subscriberCountSupported) {
            defaults[SUBSCRIBER_COUNT_STORAGE_KEY] = DEFAULT_SUBSCRIBER_COUNT_HIDDEN;
        }
        const result = await storage.get(defaults);
        setStatus(result[STORAGE_KEY] !== false);
        setPlaylistStatus(result[PLAYLIST_STORAGE_KEY] !== false);
        setLikesStatus(result[LIKES_STORAGE_KEY] === true);
        setLikeCountStatus(result[LIKE_COUNT_STORAGE_KEY] === true);
        setCommentsStatus(result[COMMENTS_STORAGE_KEY] === true);
        if (subscriberCountSupported) {
            setSubscriberCountStatus(result[SUBSCRIBER_COUNT_STORAGE_KEY] === true);
        }
    } catch (error) {
        setStatus(DEFAULT_ENABLED);
        setPlaylistStatus(DEFAULT_PLAYLIST_ENABLED);
        setLikesStatus(DEFAULT_LIKES_HIDDEN);
        setLikeCountStatus(DEFAULT_LIKE_COUNT_HIDDEN);
        setCommentsStatus(DEFAULT_COMMENTS_HIDDEN);
        if (subscriberCountSupported) {
            setSubscriberCountStatus(DEFAULT_SUBSCRIBER_COUNT_HIDDEN);
        }
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

likeCountToggle.addEventListener("change", async () => {
    const hidden = likeCountToggle.checked;
    setLikeCountStatus(hidden);
    if (!storage) return;
    try {
        await storage.set({ [LIKE_COUNT_STORAGE_KEY]: hidden });
    } catch (error) {
        // Ignore storage errors in the popup.
    }
});

commentsToggle.addEventListener("change", async () => {
    const hidden = commentsToggle.checked;
    setCommentsStatus(hidden);
    if (!storage) return;
    try {
        await storage.set({ [COMMENTS_STORAGE_KEY]: hidden });
    } catch (error) {
        // Ignore storage errors in the popup.
    }
});

if (subscriberCountToggle) {
    subscriberCountToggle.addEventListener("change", async () => {
        const hidden = subscriberCountToggle.checked;
        setSubscriberCountStatus(hidden);
        if (!storage) return;
        try {
            await storage.set({ [SUBSCRIBER_COUNT_STORAGE_KEY]: hidden });
        } catch (error) {
            // Ignore storage errors in the popup.
        }
    });
}

loadState();
