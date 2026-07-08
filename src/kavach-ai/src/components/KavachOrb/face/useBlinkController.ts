// ============================================================
// useBlinkController.ts — Automatic eye blink state machine
// Drives BlinkState changes on a natural randomized cadence.
// Returns current BlinkState — all state is local to hook.
// ============================================================

import { useEffect, useState } from "react";
import type { BlinkState } from "./FaceTypes";

const BLINK_INTERVAL_MS = 2500;   // average interval between blinks (shortened for human realism)
const BLINK_JITTER_MS   = 1000;   // ± randomness around interval
const BLINK_CLOSE_MS    = 60;     // time to close eyes (faster, snap blink)
const BLINK_OPEN_MS     = 90;     // time to fully reopen

export function useBlinkController(active: boolean = true): BlinkState {
  const [blinkState, setBlinkState] = useState<BlinkState>("open");

  useEffect(() => {
    if (!active) {
      setBlinkState("open");
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    function triggerBlink(onComplete: () => void) {
      setBlinkState("closed");
      setTimeout(() => {
        setBlinkState("half");
        setTimeout(() => {
          setBlinkState("open");
          onComplete();
        }, BLINK_OPEN_MS);
      }, BLINK_CLOSE_MS);
    }

    function scheduleBlink() {
      const delay = BLINK_INTERVAL_MS + (Math.random() - 0.5) * 2 * BLINK_JITTER_MS;
      timeoutId = setTimeout(() => {
        triggerBlink(() => {
          // 30% chance of a quick human double blink!
          if (Math.random() < 0.3) {
            setTimeout(() => {
              triggerBlink(scheduleBlink);
            }, 100);
          } else {
            scheduleBlink();
          }
        });
      }, delay);
    }

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [active]);

  return blinkState;
}
