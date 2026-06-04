"use client";
import { memo, useEffect, useState } from "react";
import { cn } from "~/lib/utils";

interface BackgroundImageProps {
  type?: "picsum" | "unsplash" | "theme";
  themeUrl?: string | null;
  isEventPage?: boolean;
  className?: string;
}

function generateUrl(type: string, themeUrl?: string | null) {
  if ((type === "theme" || type === "unsplash") && themeUrl) {
    // If it's an unsplash URL, try to optimize it by adding width/quality params if not present
    if (themeUrl.includes("unsplash.com") && !themeUrl.includes("w=")) {
      const separator = themeUrl.includes("?") ? "&" : "?";
      return `${themeUrl}${separator}w=800&q=60`;
    }
    return themeUrl;
  }
  const id = Math.floor(Math.random() * 1000);
  // Use a much smaller image size (480x270 instead of 1920x1080)
  // because it's going to be heavily blurred anyway (blur(40px))
  return `https://picsum.photos/seed/${id}/480/270`;
}

export const BackgroundImage = memo(function BackgroundImage({
  type = "picsum",
  themeUrl,
  isEventPage = false,
  className,
}: BackgroundImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(generateUrl(type, themeUrl));
  }, [type, themeUrl]);

  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = url;
  }, [url]);

  return (
    <div
      aria-hidden="true"
      suppressHydrationWarning
      className={cn(
        "fixed inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-1000",
        loaded ? (type === "picsum" ? "opacity-40" : "opacity-15") : "opacity-0",
        className
      )}
      style={{
        backgroundImage: url ? `url(${url})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: type === "picsum" ? "blur(40px)" : "blur(8px)",
        zIndex: 0,
      }}
    />
  );
});