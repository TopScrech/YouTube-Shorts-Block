(() => {
    "use strict";

    const SHORTS_HREF_RE = /\/shorts(\/|$|\?)/i;
    const SHORTS_TEXT_RE = /^shorts$/i;
    const STORAGE_KEY = "enabled";
    const DEFAULT_ENABLED = true;

    const getText = (el) => (el && el.textContent ? el.textContent.trim() : "");

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
    let documentReady = document.readyState !== "loading";

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
    let observerActive = false;
    let settingsLoaded = false;

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

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "childList") {
                if (mutation.addedNodes.length) {
                    scheduleSweep();
                }
            } else if (mutation.type === "attributes") {
                scheduleSweep();
            } else if (mutation.type === "characterData") {
                scheduleSweep();
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
        if (!enabled) return;
        removeShortsEverywhere(document);
        startObserver();
    };

    const maybeStart = () => {
        if (!documentReady || !settingsLoaded || !enabled) return;
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
            stopObserver();
            restoreShortsEverywhere(document);
        }
    };

    const applyInitialSettings = (initialEnabled) => {
        enabled = initialEnabled !== false;
        settingsLoaded = true;
        if (enabled) {
            maybeStart();
        } else {
            stopObserver();
            restoreShortsEverywhere(document);
        }
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
            .get({ [STORAGE_KEY]: DEFAULT_ENABLED })
            .then((result) => applyInitialSettings(result[STORAGE_KEY]))
            .catch(() => applyInitialSettings(DEFAULT_ENABLED));
    } else {
        applyInitialSettings(DEFAULT_ENABLED);
    }

    if (typeof browser !== "undefined" && browser.storage && browser.storage.onChanged) {
        browser.storage.onChanged.addListener((changes, area) => {
            if (area !== "local") return;
            if (!changes[STORAGE_KEY]) return;
            setEnabled(changes[STORAGE_KEY].newValue);
        });
    }

    window.addEventListener("pageshow", () => {
        scheduleSweep();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            scheduleSweep();
        }
    });
})();
