(() => {
    "use strict";

    const SHORTS_HREF_RE = /\/shorts(\/|$|\?)/i;
    const SHORTS_TEXT_RE = /^shorts$/i;

    const removed = new WeakSet();

    const getText = (el) => (el && el.textContent ? el.textContent.trim() : "");

    const markRemoved = (el) => {
        if (!el || removed.has(el)) return false;
        removed.add(el);
        el.remove();
        return true;
    };

    const removeShortsFromPivotBar = (root = document) => {
        const pivotBars = root.querySelectorAll("ytm-pivot-bar-renderer, ytm-pivot-bar");
        pivotBars.forEach((bar) => {
            const items = bar.querySelectorAll("ytm-pivot-bar-item-renderer, ytm-pivot-bar-item");
            items.forEach((item) => {
                if (removed.has(item)) return;
                const link = item.querySelector("a[href]");
                const aria = item.getAttribute("aria-label") || (link && link.getAttribute("aria-label"));
                const label = aria ? aria.trim() : getText(item);
                const href = link && link.getAttribute("href");
                if ((href && SHORTS_HREF_RE.test(href)) || (label && SHORTS_TEXT_RE.test(label))) {
                    markRemoved(item);
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
                markRemoved(container || link);
            });
        });
    };

    const removeShortsEverywhere = (root = document) => {
        removeShortsFromPivotBar(root);
        removeShortsLinksInNav(root);
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                removeShortsEverywhere(node);
            });
        }
    });

    const start = () => {
        removeShortsEverywhere(document);
        observer.observe(document.documentElement || document.body, {
            childList: true,
            subtree: true
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
