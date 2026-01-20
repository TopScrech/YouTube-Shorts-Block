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

    const removeShortsEverywhere = (root = document) => {
        removeShortsFromPivotBar(root);
        removeShortsLinksInNav(root);
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
