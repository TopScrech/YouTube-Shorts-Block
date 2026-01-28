(() => {
    "use strict";

    const SHORTS_HREF_RE = /\/shorts(\/|$|\?)/i;
    const SHORTS_TEXT_RE = /^shorts$/i;
    const STORAGE_KEY = "enabled";
    const DEFAULT_ENABLED = true;
    const PLAYLIST_STORAGE_KEY = "playlistButtonEnabled";
    const DEFAULT_PLAYLIST_ENABLED = true;
    const LIKES_STORAGE_KEY = "hideLikesDislikes";
    const DEFAULT_LIKES_HIDDEN = false;
    const PLAYLIST_BUTTON_ID = "yt-tweaks-playlist-return";
    const PLAYLIST_STYLE_ID = "yt-tweaks-playlist-return-style";
    const LIKE_LABEL_RE = /\blike(d)?\b/i;
    const DISLIKE_LABEL_RE = /\bdislike(d)?\b/i;

    const getText = (el) => (el && el.textContent ? el.textContent.trim() : "");

    const isWatchPage = () => window.location.pathname === "/watch";

    const getPlaylistId = () => {
        try {
            return new URL(window.location.href).searchParams.get("list");
        } catch (error) {
            return null;
        }
    };

    const ensurePlaylistStyle = () => {
        if (document.getElementById(PLAYLIST_STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = PLAYLIST_STYLE_ID;
        style.textContent = `
            #${PLAYLIST_BUTTON_ID} {
                display: block;
                width: calc(100% - 24px);
                box-sizing: border-box;
                padding: 12px 20px !important;
                margin: 12px;
                border-radius: 999px;
                background: var(--yt-spec-brand-button-background, #065fd4);
                color: var(--yt-spec-brand-button-text, #fff);
                text-align: center;
                font-weight: 500;
                font-family: Roboto, Arial, sans-serif;
                font-size: 14px;
                line-height: 20px;
                text-decoration: none;
                letter-spacing: 0.2px;
                transition: filter 0.15s ease-in-out;
            }

            #${PLAYLIST_BUTTON_ID}:hover {
                filter: brightness(1.05);
            }

            #${PLAYLIST_BUTTON_ID}:active {
                filter: brightness(0.95);
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    };

    const buildPlaylistUrl = (playlistId) => {
        const url = new URL("https://www.youtube.com/playlist");
        url.searchParams.set("list", playlistId);
        return url.toString();
    };

    const getPlaylistName = () => {
        const selectors = [
            "ytd-playlist-panel-renderer #title",
            "ytd-playlist-panel-renderer #title-text",
            "ytd-playlist-panel-renderer h3",
            "ytd-playlist-panel-renderer .title",
            "ytm-playlist-panel-renderer .title",
            "ytm-playlist-panel-renderer .playlist-title",
            "ytm-playlist-panel-renderer h3",
            "ytm-playlist-panel-renderer .title-text"
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
                const text = element.textContent.trim();
                if (text) return text;
            }
        }

        return null;
    };

    const normalizePlaylistLabel = (label) => {
        if (!label) return null;
        const trimmed = label.trim();
        if (trimmed === "WL") return "Watch Later";
        if (trimmed === "LL") return "Liked Videos";
        return trimmed;
    };

    const buildPlaylistLabel = (playlistId) => {
        const playlistName = normalizePlaylistLabel(getPlaylistName());
        if (playlistName) {
            return `Return to playlist ${playlistName}`;
        }

        const fallback = normalizePlaylistLabel(playlistId);
        return `Return to playlist ${fallback || "playlist"}`;
    };

    const findCommentsSection = () => (
        document.querySelector(
            "ytd-comments#comments," +
                " ytm-item-section-renderer[section-identifier='comment-item-section']," +
                " ytm-item-section-renderer.comment-section," +
                " ytm-comment-section-renderer," +
                " ytm-comments-entry-point-renderer"
        )
    );

    const findActionBar = () => (
        document.querySelector(
            "ytd-menu-renderer," +
                " ytm-slim-video-action-bar-renderer," +
                " ytm-video-action-bar-renderer"
        )
    );

    const insertAfter = (node, referenceNode) => {
        const parent = referenceNode.parentElement;
        if (!parent) return;
        if (referenceNode.nextSibling) {
            parent.insertBefore(node, referenceNode.nextSibling);
        } else {
            parent.appendChild(node);
        }
    };

    const ensurePlaylistButton = () => {
        const button = document.getElementById(PLAYLIST_BUTTON_ID);
        if (!settingsLoaded || !enabled || !playlistEnabled) {
            if (button) button.remove();
            return;
        }

        const playlistId = getPlaylistId();
        if (!playlistId || !isWatchPage()) {
            if (button) button.remove();
            return;
        }

        const comments = findCommentsSection();
        const actionBar = findActionBar();
        if (!comments && !actionBar) return;

        ensurePlaylistStyle();

        const playlistUrl = buildPlaylistUrl(playlistId);
        const buttonLabel = buildPlaylistLabel(playlistId);

        if (button) {
            button.href = playlistUrl;
            button.textContent = buttonLabel;
            button.setAttribute("aria-label", buttonLabel);
            return;
        }

        const link = document.createElement("a");
        link.id = PLAYLIST_BUTTON_ID;
        link.href = playlistUrl;
        link.textContent = buttonLabel;
        link.setAttribute("role", "button");
        link.setAttribute("aria-label", buttonLabel);

        if (comments && comments.parentElement) {
            comments.parentElement.insertBefore(link, comments);
        } else if (actionBar) {
            insertAfter(link, actionBar);
        }
    };

    const hideElement = (el) => {
        if (!el) return false;
        if (!el.isConnected) return false;
        if (el.getAttribute("data-shorts-blocked") === "true") return false;
        const prevDisplay = el.style.getPropertyValue("display");
        const prevDisplayPriority = el.style.getPropertyPriority("display");
        const prevVisibility = el.style.getPropertyValue("content-visibility");
        const prevVisibilityPriority = el.style.getPropertyPriority("content-visibility");
        el.setAttribute("data-shorts-blocked", "true");
        el.setAttribute("data-shorts-blocked-display", prevDisplay);
        el.setAttribute("data-shorts-blocked-display-priority", prevDisplayPriority);
        el.setAttribute("data-shorts-blocked-content-visibility", prevVisibility);
        el.setAttribute("data-shorts-blocked-content-visibility-priority", prevVisibilityPriority);
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("content-visibility", "hidden", "important");
        return true;
    };

    const restoreElement = (el) => {
        if (!el) return false;
        if (el.getAttribute("data-shorts-blocked") !== "true") return false;
        const prevDisplay = el.getAttribute("data-shorts-blocked-display") || "";
        const prevDisplayPriority = el.getAttribute("data-shorts-blocked-display-priority") || "";
        const prevVisibility = el.getAttribute("data-shorts-blocked-content-visibility") || "";
        const prevVisibilityPriority = el.getAttribute("data-shorts-blocked-content-visibility-priority") || "";
        if (prevDisplay) {
            el.style.setProperty("display", prevDisplay, prevDisplayPriority);
        } else {
            el.style.removeProperty("display");
        }
        if (prevVisibility) {
            el.style.setProperty("content-visibility", prevVisibility, prevVisibilityPriority);
        } else {
            el.style.removeProperty("content-visibility");
        }
        el.removeAttribute("data-shorts-blocked");
        el.removeAttribute("data-shorts-blocked-display");
        el.removeAttribute("data-shorts-blocked-display-priority");
        el.removeAttribute("data-shorts-blocked-content-visibility");
        el.removeAttribute("data-shorts-blocked-content-visibility-priority");
        return true;
    };

    const hideLikesElement = (el) => {
        if (!el) return false;
        if (!el.isConnected) return false;
        if (el.getAttribute("data-likes-hidden") === "true") return false;
        const prevDisplay = el.style.getPropertyValue("display");
        const prevDisplayPriority = el.style.getPropertyPriority("display");
        const prevVisibility = el.style.getPropertyValue("content-visibility");
        const prevVisibilityPriority = el.style.getPropertyPriority("content-visibility");
        el.setAttribute("data-likes-hidden", "true");
        el.setAttribute("data-likes-hidden-display", prevDisplay);
        el.setAttribute("data-likes-hidden-display-priority", prevDisplayPriority);
        el.setAttribute("data-likes-hidden-content-visibility", prevVisibility);
        el.setAttribute("data-likes-hidden-content-visibility-priority", prevVisibilityPriority);
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("content-visibility", "hidden", "important");
        return true;
    };

    const restoreLikesElement = (el) => {
        if (!el) return false;
        if (el.getAttribute("data-likes-hidden") !== "true") return false;
        const prevDisplay = el.getAttribute("data-likes-hidden-display") || "";
        const prevDisplayPriority = el.getAttribute("data-likes-hidden-display-priority") || "";
        const prevVisibility = el.getAttribute("data-likes-hidden-content-visibility") || "";
        const prevVisibilityPriority = el.getAttribute("data-likes-hidden-content-visibility-priority") || "";
        if (prevDisplay) {
            el.style.setProperty("display", prevDisplay, prevDisplayPriority);
        } else {
            el.style.removeProperty("display");
        }
        if (prevVisibility) {
            el.style.setProperty("content-visibility", prevVisibility, prevVisibilityPriority);
        } else {
            el.style.removeProperty("content-visibility");
        }
        el.removeAttribute("data-likes-hidden");
        el.removeAttribute("data-likes-hidden-display");
        el.removeAttribute("data-likes-hidden-display-priority");
        el.removeAttribute("data-likes-hidden-content-visibility");
        el.removeAttribute("data-likes-hidden-content-visibility-priority");
        return true;
    };

    const restoreLikesDislikes = (root = document) => {
        const hidden = root.querySelectorAll("[data-likes-hidden='true']");
        hidden.forEach((el) => restoreLikesElement(el));
    };

    const isLikeDislikeLabel = (label) => {
        if (!label) return false;
        const trimmed = label.trim();
        if (!trimmed) return false;
        if (DISLIKE_LABEL_RE.test(trimmed)) return true;
        return LIKE_LABEL_RE.test(trimmed);
    };

    const isLikeDislikeElement = (el) => {
        if (!el) return false;
        const labels = [
            el.getAttribute && el.getAttribute("aria-label"),
            el.getAttribute && el.getAttribute("title"),
            el.getAttribute && el.getAttribute("data-tooltip-text"),
            getText(el)
        ];
        for (const label of labels) {
            if (isLikeDislikeLabel(label)) return true;
        }
        return false;
    };

    const hideLikesDislikes = (root = document) => {
        const actionBars = root.querySelectorAll(
            "ytd-menu-renderer, ytd-reel-player-overlay-renderer, ytd-reel-player-header-renderer, ytm-slim-video-action-bar-renderer, ytm-video-action-bar-renderer"
        );
        const targets = new Set();
        actionBars.forEach((bar) => {
            const labeled = bar.querySelectorAll("[aria-label], [title], [data-tooltip-text]");
            labeled.forEach((el) => {
                if (!isLikeDislikeElement(el)) return;
                const container =
                    el.closest(
                        "ytd-segmented-like-dislike-button-renderer, ytd-like-button-renderer, ytd-dislike-button-renderer, ytd-toggle-button-renderer, ytm-like-button-renderer, ytm-dislike-button-renderer, ytm-toggle-button-renderer"
                    ) || el;
                targets.add(container);
            });
        });
        targets.forEach((el) => hideLikesElement(el));
    };

    const restoreShortsEverywhere = (root = document) => {
        const blocked = root.querySelectorAll("[data-shorts-blocked='true']");
        blocked.forEach((el) => restoreElement(el));
    };

    const removeShortsFromPivotBar = (root = document) => {
        const pivotBars = root.querySelectorAll("ytm-pivot-bar-renderer, ytm-pivot-bar");
        pivotBars.forEach((bar) => {
            const items = bar.querySelectorAll("ytm-pivot-bar-item-renderer, ytm-pivot-bar-item");
            items.forEach((item) => {
                const link = item.querySelector("a[href]");
                const aria = item.getAttribute("aria-label") || (link && link.getAttribute("aria-label"));
                const label = aria ? aria.trim() : getText(item);
                const href = link && link.getAttribute("href");
                if ((href && SHORTS_HREF_RE.test(href)) || (label && SHORTS_TEXT_RE.test(label))) {
                    hideElement(item);
                }
            });
        });
    };

    const removeShortsLinksInNav = (root = document) => {
        const navs = root.querySelectorAll("nav, ytm-pivot-bar-renderer, ytm-pivot-bar");
        navs.forEach((nav) => {
            const links = nav.querySelectorAll("a[href]");
            links.forEach((link) => {
                const href = link.getAttribute("href");
                if (!href || !SHORTS_HREF_RE.test(href)) return;
                const container =
                    link.closest("ytm-pivot-bar-item-renderer") ||
                    link.closest("ytm-pivot-bar-item") ||
                    link.closest("[role='tab']") ||
                    link.closest("a");
                hideElement(container || link);
            });
        });
    };

    const removeShortsFromDesktopSidebar = (root = document) => {
        const entries = root.querySelectorAll("ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer");
        entries.forEach((entry) => {
            const link = entry.querySelector("a[href]");
            const href = link && link.getAttribute("href");
            const aria = entry.getAttribute("aria-label") || (link && (link.getAttribute("aria-label") || link.getAttribute("title")));
            const label = aria ? aria.trim() : getText(entry);
            if ((href && SHORTS_HREF_RE.test(href)) || (label && SHORTS_TEXT_RE.test(label))) {
                hideElement(entry);
            }
        });

        const sidebarLinks = root.querySelectorAll("ytd-guide-renderer a[href], ytd-mini-guide-renderer a[href]");
        sidebarLinks.forEach((link) => {
            const href = link.getAttribute("href");
            if (!href || !SHORTS_HREF_RE.test(href)) return;
            const entry = link.closest("ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer") || link;
            hideElement(entry);
        });
    };

    const removeShortsChannelTabs = (root = document) => {
        const tabLists = root.querySelectorAll("ytm-channel-sub-menu-renderer, ytm-tab-row-renderer, [role='tablist']");
        tabLists.forEach((list) => {
            const tabs = list.querySelectorAll(
                "ytm-channel-tab-renderer, ytm-channel-sub-menu-item-renderer, ytm-tab-row-item-renderer, [role='tab'], a[href]"
            );
            tabs.forEach((tab) => {
                const link = tab.matches && tab.matches("a[href]") ? tab : tab.querySelector && tab.querySelector("a[href]");
                const href = link && link.getAttribute("href");
                const label = getText(tab);
                if ((href && SHORTS_HREF_RE.test(href)) || (label && SHORTS_TEXT_RE.test(label))) {
                    const container = tab.closest ? tab.closest(CHANNEL_TAB_CONTAINER_SELECTOR) : null;
                    hideElement(container || tab);
                }
            });
        });

        const shortsLinks = root.querySelectorAll('a[href*="/shorts"]');
        shortsLinks.forEach((link) => {
            if (!isInChannelTabs(link)) return;
            const href = link.getAttribute("href");
            if (!href || !SHORTS_HREF_RE.test(href)) return;
            const container = link.closest(CHANNEL_TAB_CONTAINER_SELECTOR) || link;
            hideElement(container);
        });
    };

    const NAV_CONTAINER_SELECTOR = "nav, ytm-pivot-bar-renderer, ytm-pivot-bar, ytm-mobile-topbar-renderer";
    const CHANNEL_TAB_CONTAINER_SELECTOR =
        "ytm-channel-tab-renderer, ytm-channel-sub-menu-renderer, ytm-channel-sub-menu-item-renderer, ytm-tab-row-renderer, ytm-tab-row-item-renderer, [role='tab'], [role='tablist']";

    const isInNavigation = (el) => !!(el && el.closest && el.closest(NAV_CONTAINER_SELECTOR));
    const isInChannelTabs = (el) => !!(el && el.closest && el.closest(CHANNEL_TAB_CONTAINER_SELECTOR));

    const storage = (() => {
        try {
            return typeof browser !== "undefined" && browser.storage && browser.storage.local ? browser.storage.local : null;
        } catch (error) {
            return null;
        }
    })();

    let enabled = DEFAULT_ENABLED;
    let playlistEnabled = DEFAULT_PLAYLIST_ENABLED;
    let likesHidden = DEFAULT_LIKES_HIDDEN;
    let documentReady = document.readyState !== "loading";
    let playlistEnsureQueued = false;

    const containerHasShortsLabel = (container) => {
        if (!container) return false;
        if (container.querySelector('a[href*="/shorts"]')) return true;
        const attrKeys = ["section-identifier", "tab-identifier", "identifier", "data-identifier", "data-section-id"];
        for (const key of attrKeys) {
            const value = container.getAttribute && container.getAttribute(key);
            if (value && /shorts/i.test(value)) {
                return true;
            }
        }
        const labelNodes = container.querySelectorAll(
            "[aria-label], [title], h1, h2, h3, ytm-shelf-title, ytm-shelf-header-renderer, ytm-channel-shelf-title-renderer, ytm-channel-shelf-header-renderer"
        );
        for (const node of labelNodes) {
            const aria = node.getAttribute && node.getAttribute("aria-label");
            const title = node.getAttribute && node.getAttribute("title");
            const text = (aria || title || getText(node)).trim();
            if (text && SHORTS_TEXT_RE.test(text)) {
                return true;
            }
        }
        return false;
    };

    const removeShortsShelves = (root = document) => {
        const reelShelves = root.querySelectorAll("ytm-reel-shelf-renderer, ytm-reel-item-renderer, ytd-reel-shelf-renderer");
        reelShelves.forEach((shelf) => {
            if (isInNavigation(shelf)) return;
            hideElement(shelf);
        });

        const containers = root.querySelectorAll(
            "ytm-rich-section-renderer, ytm-shelf-renderer, ytd-rich-section-renderer, ytm-channel-shelf-renderer"
        );
        containers.forEach((container) => {
            if (containerHasShortsLabel(container)) {
                const shelf =
                    container.querySelector("ytm-reel-shelf-renderer, ytm-reel-item-renderer, ytd-reel-shelf-renderer, ytm-shelf-renderer") ||
                    container;
                hideElement(shelf);
            }
        });

        const shortsLinks = root.querySelectorAll('a[href*="/shorts"]');
        shortsLinks.forEach((link) => {
            if (isInNavigation(link)) return;
            const href = link.getAttribute("href");
            if (!href || !SHORTS_HREF_RE.test(href)) return;
            const container =
                link.closest("ytm-reel-shelf-renderer, ytm-shelf-renderer, ytd-reel-shelf-renderer, ytm-channel-shelf-renderer") ||
                link;
            hideElement(container);
        });
    };

    const removeShortsEverywhere = (root = document) => {
        removeShortsFromPivotBar(root);
        removeShortsLinksInNav(root);
        removeShortsFromDesktopSidebar(root);
        removeShortsChannelTabs(root);
        removeShortsShelves(root);
    };

    let sweepScheduled = false;
    let likesSweepScheduled = false;
    let observerActive = false;
    let settingsLoaded = false;

    const schedulePlaylistEnsure = () => {
        if (!settingsLoaded) return;
        if (playlistEnsureQueued) return;
        playlistEnsureQueued = true;
        requestAnimationFrame(() => {
            playlistEnsureQueued = false;
            ensurePlaylistButton();
        });
    };

    const scheduleSweep = () => {
        if (!settingsLoaded || !enabled) return;
        if (sweepScheduled) return;
        sweepScheduled = true;
        requestAnimationFrame(() => {
            sweepScheduled = false;
            if (!enabled) return;
            removeShortsEverywhere(document);
        });
    };

    const scheduleLikesSweep = () => {
        if (!settingsLoaded || !likesHidden) return;
        if (likesSweepScheduled) return;
        likesSweepScheduled = true;
        requestAnimationFrame(() => {
            likesSweepScheduled = false;
            if (!likesHidden) return;
            hideLikesDislikes(document);
        });
    };

    const observer = new MutationObserver((mutations) => {
        if (mutations.length) {
            schedulePlaylistEnsure();
        }
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                if (mutation.addedNodes.length) {
                    scheduleSweep();
                    scheduleLikesSweep();
                }
            } else if (mutation.type === "attributes") {
                scheduleSweep();
                scheduleLikesSweep();
            } else if (mutation.type === "characterData") {
                scheduleSweep();
                scheduleLikesSweep();
            }
        }
    });

    const startObserver = () => {
        if (observerActive) return;
        const root = document.documentElement || document.body;
        if (!root) return;
        observer.observe(root, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ["href", "aria-label", "title", "class", "role"]
        });
        observerActive = true;
    };

    const stopObserver = () => {
        if (!observerActive) return;
        observer.disconnect();
        observerActive = false;
    };

    const start = () => {
        if (enabled) {
            removeShortsEverywhere(document);
        }
        if (likesHidden) {
            hideLikesDislikes(document);
        }
        schedulePlaylistEnsure();
        if (enabled || likesHidden) {
            startObserver();
        }
    };

    const maybeStart = () => {
        if (!documentReady || !settingsLoaded) return;
        if (!enabled && !likesHidden) return;
        start();
    };

    const setEnabled = (nextEnabled) => {
        const normalized = nextEnabled !== false;
        if (enabled === normalized) return;
        enabled = normalized;
        if (enabled) {
            if (documentReady) {
                start();
            }
        } else {
            restoreShortsEverywhere(document);
            ensurePlaylistButton();
            if (!likesHidden) {
                stopObserver();
            }
        }
    };

    const setPlaylistEnabled = (nextEnabled) => {
        const normalized = nextEnabled !== false;
        if (playlistEnabled === normalized) return;
        playlistEnabled = normalized;
        schedulePlaylistEnsure();
    };

    const setLikesHidden = (nextHidden) => {
        const normalized = nextHidden === true;
        if (likesHidden === normalized) return;
        likesHidden = normalized;
        if (likesHidden) {
            if (documentReady) {
                start();
            }
        } else {
            restoreLikesDislikes(document);
            if (!enabled) {
                stopObserver();
            }
        }
    };

    const applyInitialSettings = (initialEnabled, initialPlaylistEnabled, initialLikesHidden) => {
        enabled = initialEnabled !== false;
        playlistEnabled = initialPlaylistEnabled !== false;
        likesHidden = initialLikesHidden === true;
        settingsLoaded = true;
        if (enabled || likesHidden) {
            maybeStart();
        } else {
            stopObserver();
        }
        if (!enabled) {
            restoreShortsEverywhere(document);
        }
        if (!likesHidden) {
            restoreLikesDislikes(document);
        }
        schedulePlaylistEnsure();
    };

    const handleReady = () => {
        documentReady = true;
        maybeStart();
    };

    if (!documentReady) {
        document.addEventListener("DOMContentLoaded", handleReady, { once: true });
    } else {
        handleReady();
    }

    if (storage) {
        storage
            .get({
                [STORAGE_KEY]: DEFAULT_ENABLED,
                [PLAYLIST_STORAGE_KEY]: DEFAULT_PLAYLIST_ENABLED,
                [LIKES_STORAGE_KEY]: DEFAULT_LIKES_HIDDEN
            })
            .then((result) => applyInitialSettings(result[STORAGE_KEY], result[PLAYLIST_STORAGE_KEY], result[LIKES_STORAGE_KEY]))
            .catch(() => applyInitialSettings(DEFAULT_ENABLED, DEFAULT_PLAYLIST_ENABLED, DEFAULT_LIKES_HIDDEN));
    } else {
        applyInitialSettings(DEFAULT_ENABLED, DEFAULT_PLAYLIST_ENABLED, DEFAULT_LIKES_HIDDEN);
    }

    if (typeof browser !== "undefined" && browser.storage && browser.storage.onChanged) {
        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== "local") return;
            if (changes[STORAGE_KEY]) {
                setEnabled(changes[STORAGE_KEY].newValue);
            }
            if (changes[PLAYLIST_STORAGE_KEY]) {
                setPlaylistEnabled(changes[PLAYLIST_STORAGE_KEY].newValue);
            }
            if (changes[LIKES_STORAGE_KEY]) {
                setLikesHidden(changes[LIKES_STORAGE_KEY].newValue);
            }
        });
    }

    window.addEventListener("pageshow", () => {
        scheduleSweep();
        scheduleLikesSweep();
        schedulePlaylistEnsure();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            scheduleSweep();
            scheduleLikesSweep();
            schedulePlaylistEnsure();
        }
    });

    const handleYouTubeNavigate = () => {
        scheduleLikesSweep();
        schedulePlaylistEnsure();
    };

    document.addEventListener("yt-navigate-finish", handleYouTubeNavigate);
    document.addEventListener("yt-page-data-updated", handleYouTubeNavigate);

    schedulePlaylistEnsure();
    scheduleLikesSweep();
})();
