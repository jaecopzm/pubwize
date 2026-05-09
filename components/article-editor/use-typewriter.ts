"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Typewriter hook — buffers incoming text and reveals it character by character.
 * Creates the premium ChatGPT-like streaming effect.
 */
export function useTypewriter(text: string, speed = 12) {
  const [displayed, setDisplayed] = useState("");
  const displayedLengthRef = useRef(0);

  useEffect(() => {
    if (text.length <= displayedLengthRef.current) return;

    const timer = setTimeout(() => {
      const burst = Math.min(text.length - displayedLengthRef.current, Math.floor(Math.random() * 3) + 3);
      displayedLengthRef.current += burst;
      setDisplayed(text.slice(0, displayedLengthRef.current));
    }, speed);

    return () => clearTimeout(timer);
  }, [text, speed]);

  useEffect(() => {
    if (text === "") {
      setDisplayed("");
      displayedLengthRef.current = 0;
    }
  }, [text]);

  return displayed;
}
