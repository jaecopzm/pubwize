"use client";

import { useEffect, useState } from "react";

/**
 * Typewriter hook — buffers incoming text and reveals it character by character.
 * Creates the premium ChatGPT-like streaming effect.
 */
export function useTypewriter(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (text.length <= displayed.length) return;
    const timer = setTimeout(() => {
      // Reveal in small bursts (3-5 chars) for a natural feel
      const burst = Math.min(text.length - displayed.length, Math.floor(Math.random() * 3) + 3);
      setDisplayed(text.slice(0, displayed.length + burst));
    }, speed);
    return () => clearTimeout(timer);
  }, [text, displayed, speed]);

  // Reset when text is cleared
  useEffect(() => {
    if (text === "") setDisplayed("");
  }, [text]);

  return displayed;
}
