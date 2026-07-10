"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

export function InactivityTimer() {
  const { logout } = useAuth();

  const reset = useCallback(() => {
    clearTimeout((window as Window & { __idleTimer?: ReturnType<typeof setTimeout> }).__idleTimer);
    (window as Window & { __idleTimer?: ReturnType<typeof setTimeout> }).__idleTimer =
      setTimeout(logout, TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(
        (window as Window & { __idleTimer?: ReturnType<typeof setTimeout> }).__idleTimer
      );
    };
  }, [reset]);

  return null;
}
