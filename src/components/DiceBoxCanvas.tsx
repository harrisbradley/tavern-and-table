"use client";

import { useEffect, useRef, useState } from "react";

interface DiceRollEventDetail {
  notation: string;
  onComplete: (total: number, rolls: number[]) => void;
}

export default function DiceBoxCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initDiceBox = async () => {
      try {
        console.log("[DiceBox] Starting import...");
        const DiceBoxModule = await import("@3d-dice/dice-box");
        const DiceBoxClass = DiceBoxModule.default;

        if (!containerRef.current || cancelled) return;
        console.log("[DiceBox] Container found, clearing and creating instance...");

        containerRef.current.innerHTML = "";

        const box = new DiceBoxClass({
          container: "#dice-box-canvas-target",
          assetPath: "/assets/dice-box/",
          theme: "default",
          offscreen: false,
          scale: 6,
          gravity: 1,
          mass: 1,
          delay: 100,
        });

        console.log("[DiceBox] Calling box.init()...");
        await box.init();

        if (cancelled) {
          console.log("[DiceBox] Init completed but effect was cleaned up, discarding.");
          return;
        }

        diceBoxRef.current = box;
        console.log("[DiceBox] Successfully initialized! Canvas children:", containerRef.current?.children.length);
      } catch (err) {
        console.error("[DiceBox] Failed to initialize:", err);
      }
    };

    initDiceBox();

    const handleTriggerRoll = async (event: Event) => {
      const customEvent = event as CustomEvent<DiceRollEventDetail>;
      const { notation, onComplete } = customEvent.detail;

      console.log("[DiceBox] Roll triggered:", notation, "| box ready:", !!diceBoxRef.current);

      if (!diceBoxRef.current) {
        console.warn("[DiceBox] Not initialized yet — using fallback");
        const mockTotal = Math.floor(Math.random() * 20) + 1;
        onComplete(mockTotal, [mockTotal]);
        return;
      }

      setIsRolling(true);
      try {
        console.log("[DiceBox] Clearing previous dice...");
        await diceBoxRef.current.clear();

        console.log("[DiceBox] Rolling:", notation);
        const rollPromise = diceBoxRef.current.roll(notation);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Roll timed out — face -1 likely")), 10000)
        );
        const results = await Promise.race([rollPromise, timeoutPromise]);
        console.log("[DiceBox] Roll results:", results);

        const rolls = results.map((d: any) => d.value);
        const total = rolls.reduce((sum: number, val: number) => sum + val, 0);

        setTimeout(() => {
          setIsRolling(false);
          onComplete(total, rolls);
        }, 1200);
      } catch (error) {
        console.error("[DiceBox] Error during roll:", error);
        setIsRolling(false);
        // Generate a realistic fallback from the notation (e.g. "2d6", "1d20")
        const match = notation.match(/^(\d+)d(\d+)$/i);
        if (match) {
          const count = parseInt(match[1]);
          const sides = parseInt(match[2]);
          const fallbackRolls = Array.from({ length: count }, () =>
            Math.floor(Math.random() * sides) + 1
          );
          onComplete(fallbackRolls.reduce((a, b) => a + b, 0), fallbackRolls);
        } else {
          const fallback = Math.floor(Math.random() * 20) + 1;
          onComplete(fallback, [fallback]);
        }
      }
    };

    window.addEventListener("trigger-dice-roll", handleTriggerRoll);

    return () => {
      cancelled = true;
      window.removeEventListener("trigger-dice-roll", handleTriggerRoll);
      diceBoxRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <>
      {/* Full screen blocking overlay during rolling to focus user attention */}
      {isRolling && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 pointer-events-none" />
      )}

      <div
        ref={containerRef}
        id="dice-box-canvas-target"
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ height: "100%", width: "100%" }}
      />
    </>
  );
}

// Helper function to invoke dice rolls easily from React components
export function triggerDiceRoll(notation: string, onComplete: (total: number, rolls: number[]) => void) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("trigger-dice-roll", {
    detail: { notation, onComplete }
  });
  window.dispatchEvent(event);
}
