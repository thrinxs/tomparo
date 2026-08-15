"use client";

import { useEffect, useCallback } from "react";
import { useFaviconStore } from "@/lib/favicon-store";

function drawFavicon(dotColor: string | null): void {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.width  = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.onload = () => {
    // Draw original favicon
    ctx.drawImage(img, 0, 0, 32, 32);

    // Convert all non-transparent pixels to white
    const imageData = ctx.getImageData(0, 0, 32, 32);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 10) {
        d[i]     = 255; // R
        d[i + 1] = 255; // G
        d[i + 2] = 255; // B
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Draw status dot in top-right corner
    if (dotColor) {
      // White outline ring
      ctx.beginPath();
      ctx.arc(25, 7, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a"; // dark bg ring
      ctx.fill();

      // Colored dot
      ctx.beginPath();
      ctx.arc(25, 7, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }

    // Apply to all favicon link elements
    const faviconUrl = canvas.toDataURL("image/png");
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[sizes="16x16"]',
      'link[sizes="32x32"]',
    ];

    let applied = false;
    selectors.forEach((selector) => {
      const el = document.querySelector(selector) as HTMLLinkElement | null;
      if (el) { el.href = faviconUrl; applied = true; }
    });

    if (!applied) {
      const link = document.createElement("link");
      link.rel  = "icon";
      link.type = "image/png";
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  };

  img.onerror = () => {
    // Fallback — draw plain white circle favicon if image fails
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, Math.PI * 2);
    ctx.fill();
    if (dotColor) {
      ctx.beginPath();
      ctx.arc(25, 7, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement || document.createElement("link");
    link.rel  = "icon";
    link.href = canvas.toDataURL("image/png");
    document.head.appendChild(link);
  };

  img.crossOrigin = "anonymous";
  img.src = "/images/favicon_io/favicon-32x32.png?" + Date.now();
}

function playSuccessChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, startDelay: number, duration: number, volume = 0.25) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
      osc.start(ctx.currentTime + startDelay);
      osc.stop(ctx.currentTime + startDelay + duration + 0.05);
    };

    // Soft two-tone ascending chime
    playTone(523.25, 0,    0.25); // C5
    playTone(659.25, 0.18, 0.35); // E5
    playTone(783.99, 0.32, 0.45); // G5
  } catch {
    // Silently fail — sound is non-critical
  }
}

export default function FaviconManager() {
  const status  = useFaviconStore((s) => s.status);
  const setIdle = useFaviconStore((s) => s.setIdle);

  useEffect(() => {
    if (status === "loading") {
      drawFavicon("#f97316"); // orange
    } else if (status === "success") {
      drawFavicon("#22c55e"); // green
      playSuccessChime();
      const timer = setTimeout(() => {
        drawFavicon(null); // back to clean white
        setIdle();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      drawFavicon(null); // clean white
    }
  }, [status, setIdle]);

  // Draw white favicon on mount
  useEffect(() => {
    drawFavicon(null);
  }, []);

  return null;
}
