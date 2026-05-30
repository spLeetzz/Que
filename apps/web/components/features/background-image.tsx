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
  if ((type === "theme" || type === "unsplash") && themeUrl) return themeUrl;
  const id = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${id}/1920/1080`;
}

export const BackgroundImage = memo(function BackgroundImage({
  type = "picsum",
  themeUrl,
  isEventPage = false,
  className,
}: BackgroundImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [url] = useState(() => generateUrl(type, themeUrl));

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = url;
  }, [url]);

  if (!loaded) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-1000",
        type === "picsum" ? "opacity-40" : "opacity-15",
        className
      )}
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: type === "picsum" ? "blur(40px)" : "blur(8px)",
        zIndex: 0,
      }}
    />
  );
});