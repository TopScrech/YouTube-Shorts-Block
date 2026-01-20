(() => {
    "use strict";

    const SHORTS_HREF_RE = /\/shorts(\/|$|\?)/i;
    const SHORTS_TEXT_RE = /^shorts$/i;

    const getText = (el) => (el && el.textContent ? el.textContent.trim() : "");

    const removeElement = (el) => {
        if (!el) return false;
        if (!el.isConnected) return false;
        el.remove();
        return true;
    };

    const hideElement = (el) => {
        if (!el) return false;
        if (!el.isConnected) return false;
        el.setAttribute("data-shorts-blocked", "true");
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("content-visibility", "hidden", "important");
        return true;
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
                    removeElement(item);
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
                removeElement(container || link);
            });
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
        removeShortsChannelTabs(root);
        removeShortsShelves(root);
    };

    let sweepScheduled = false;
    const scheduleSweep = () => {
        if (sweepScheduled) return;
        sweepScheduled = true;
        requestAnimationFrame(() => {
            sweepScheduled = false;
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

    const start = () => {
        removeShortsEverywhere(document);
        observer.observe(document.documentElement || document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeFilter: ["href", "aria-label", "title", "class", "role"]
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
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
