"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Set the start time when the pathname changes
    startTimeRef.current = Date.now();

    // The cleanup function runs when the user leaves the page/pathname changes
    return () => {
      const endTime = Date.now();
      const durationInSeconds = Math.floor(
        (endTime - startTimeRef.current) / 1000,
      );

      // Only track visits longer than 1 second to avoid "noise"
      if (durationInSeconds > 1) {
        const payload = {
          pathname: pathname,
          duration: durationInSeconds,
          startTime: new Date(startTimeRef.current),
          endTime: new Date(endTime),
        };

        // Use sendBeacon for more reliable delivery during page unmount
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/tracker", JSON.stringify(payload));
        } else {
          fetch("/api/tracker", {
            method: "POST",
            body: JSON.stringify(payload),
            keepalive: true,
          });
        }
      }
    };
  }, [pathname]);

  return null; // This is a logic-only component
}
