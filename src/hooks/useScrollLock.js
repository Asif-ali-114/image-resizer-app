import { useEffect } from "react";

export function useScrollLock() {
  useEffect(() => {
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;
    const originalHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalBodyOverscrollBehavior = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.documentElement.style.height = "100%";

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.height = "100%";

    const blockKeyboardBrowserZoom = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;

      const key = String(event.key || "").toLowerCase();
      const isZoomKey = key === "+" || key === "=" || key === "-" || key === "_" || key === "0";
      if (!isZoomKey) return;

      event.preventDefault();
    };

    const blockGestureZoom = (event) => {
      event.preventDefault();
    };

    let lastTouchDistance = null;

    const blockTouchPinchZoom = (event) => {
      if (event.touches?.length !== 2) {
        lastTouchDistance = null;
        return;
      }

      const [first, second] = event.touches;
      const dx = first.clientX - second.clientX;
      const dy = first.clientY - second.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (lastTouchDistance !== null && Math.abs(distance - lastTouchDistance) > 5) {
        event.preventDefault();
      }

      lastTouchDistance = distance;
    };

    const resetTouchDistance = () => {
      lastTouchDistance = null;
    };

    const blockDocumentScroll = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      let element = event.target;
      let foundScrollable = false;

      while (element && element !== document.documentElement) {
        if (element.nodeType !== 1) {
          element = element.parentElement;
          continue;
        }

        const style = window.getComputedStyle(element);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;

        const canScrollY = (overflowY === "auto" || overflowY === "scroll") && element.scrollHeight > element.clientHeight + 1;
        const canScrollX = (overflowX === "auto" || overflowX === "scroll") && element.scrollWidth > element.clientWidth + 1;

        if (canScrollY || canScrollX) {
          foundScrollable = true;

          const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
          const atTop = element.scrollTop <= 0;
          const atRight = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
          const atLeft = element.scrollLeft <= 0;

          const scrollingDown = event.deltaY > 0;
          const scrollingUp = event.deltaY < 0;
          const scrollingRight = event.deltaX > 0;
          const scrollingLeft = event.deltaX < 0;

          if ((atBottom && scrollingDown) || (atTop && scrollingUp) || (atRight && scrollingRight) || (atLeft && scrollingLeft)) {
            event.preventDefault();
            event.stopPropagation();
          }
          break;
        }

        element = element.parentElement;
      }

      if (!foundScrollable) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const blockWindowScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    document.addEventListener("wheel", blockDocumentScroll, { passive: false, capture: true });
    document.addEventListener("keydown", blockKeyboardBrowserZoom, { passive: false, capture: true });
    document.addEventListener("gesturestart", blockGestureZoom, { passive: false, capture: true });
    document.addEventListener("gesturechange", blockGestureZoom, { passive: false, capture: true });
    document.addEventListener("gestureend", blockGestureZoom, { passive: false, capture: true });
    document.addEventListener("touchmove", blockTouchPinchZoom, { passive: false, capture: true });
    document.addEventListener("touchend", resetTouchDistance, { passive: false, capture: true });
    document.addEventListener("touchcancel", resetTouchDistance, { passive: false, capture: true });
    window.addEventListener("scroll", blockWindowScroll, { passive: false, capture: true });

    return () => {
      document.removeEventListener("wheel", blockDocumentScroll, true);
      document.removeEventListener("keydown", blockKeyboardBrowserZoom, true);
      document.removeEventListener("gesturestart", blockGestureZoom, true);
      document.removeEventListener("gesturechange", blockGestureZoom, true);
      document.removeEventListener("gestureend", blockGestureZoom, true);
      document.removeEventListener("touchmove", blockTouchPinchZoom, true);
      document.removeEventListener("touchend", resetTouchDistance, true);
      document.removeEventListener("touchcancel", resetTouchDistance, true);
      window.removeEventListener("scroll", blockWindowScroll);

      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscrollBehavior;
      document.documentElement.style.height = originalHtmlHeight;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overscrollBehavior = originalBodyOverscrollBehavior;
      document.body.style.height = originalBodyHeight;
    };
  }, []);
}

export function useTemporaryScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousHeight = document.body.style.height;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100%";

    return () => {
      document.body.style.overflow = previousOverflow || "hidden";
      document.body.style.height = previousHeight || "100%";
    };
  }, [isLocked]);
}