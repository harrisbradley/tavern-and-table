"use client";

import { useEffect, useRef, useState } from "react";

interface DiceRollEventDetail {
  notation: string;
  onComplete: (total: number, rolls: number[]) => void;
}

export default function DiceBoxCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    let activeBox: any = null;

    const initDiceBox = async () => {
      try {
        // Dynamically import to prevent Next.js SSR build errors
        const DiceBoxModule = await import("@3d-dice/dice-box");
        const DiceBoxClass = DiceBoxModule.default;

        if (!containerRef.current) return;

        // Clean up any existing canvas in container
        containerRef.current.innerHTML = "";

        const box = new DiceBoxClass({
          container: "#dice-box-canvas-target",
          assetPath: "/assets/dice-box/",
          theme: "default",
          offscreen: false, // Set to false to avoid Web Worker cross-origin errors in standard dev environments
          scale: 5, // Custom scaling for 6-inch mobile screens
          gravity: 2, // Slightly higher gravity so dice settle faster for slick gameplay
          mass: 1,
          delay: 10,
        });

        await box.init();
        diceBoxRef.current = box;
        activeBox = box;
        setIsInitialized(true);
        console.log("3D DiceBox successfully initialized!");
      } catch (err) {
        console.error("Failed to initialize DiceBox:", err);
      }
    };

    initDiceBox();

    // Setup global listener for rolls
    const handleTriggerRoll = async (event: Event) => {
      const customEvent = event as CustomEvent<DiceRollEventDetail>;
      const { notation, onComplete } = customEvent.detail;

      if (!diceBoxRef.current || !isInitialized) {
        console.warn("DiceBox is not initialized yet!");
        // Fallback for debugging if dice-box isn't ready
        const mockTotal = Math.floor(Math.random() * 20) + 1;
        onComplete(mockTotal, [mockTotal]);
        return;
      }

      setIsRolling(true);
      try {
        // Clear previous dice from screen
        await diceBoxRef.current.clear();
        
        // Roll the dice
        const results = await diceBoxRef.current.roll(notation);
        
        // Structure the results
        const rolls = results.map((d: any) => d.value);
        const total = rolls.reduce((sum: number, val: number) => sum + val, 0);
        
        // Delay slightly before completing so user can see final numbers
        setTimeout(() => {
          setIsRolling(false);
          onComplete(total, rolls);
        }, 1200);
      } catch (error) {
        console.error("Error during dice roll:", error);
        setIsRolling(false);
        // Fallback
        onComplete(10, [10]);
      }
    };

    window.addEventListener("trigger-dice-roll", handleTriggerRoll);

    return () => {
      window.removeEventListener("trigger-dice-roll", handleTriggerRoll);
      // Clean up the canvas from container if possible
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [isInitialized]);

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
