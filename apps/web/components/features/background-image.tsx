"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

interface BackgroundImageProps {
	type?: "picsum" | "unsplash" | "theme";
	themeUrl?: string | null;
	isEventPage?: boolean;
	className?: string;
}

export function BackgroundImage({
	type = "picsum",
	themeUrl,
	isEventPage = false,
	className,
}: BackgroundImageProps) {
	const [imageUrl, setImageUrl] = useState<string>("");
	const [key, setKey] = useState(0);

	useEffect(() => {
		// Generate new random image URL
		const generateUrl = () => {
			if (type === "theme" && themeUrl) {
				return themeUrl;
			} else if (type === "unsplash" && themeUrl) {
				return themeUrl;
			} else {
				// Picsum random image
				const randomId = Math.random().toString(36).substring(7);
				return `https://picsum.photos/seed/${randomId}/1920/1080?blur=10`;
			}
		};

		setImageUrl(generateUrl());
	}, [type, themeUrl, key]);

	// Change image every 3 seconds for picsum backgrounds
	useEffect(() => {
		if (type !== "picsum") return;

		const interval = setInterval(() => {
			setKey((prev) => prev + 1);
		}, 3000);

		return () => clearInterval(interval);
	}, [type]);

	if (!imageUrl) return null;

	return (
		<div
			className={cn(
				"absolute inset-0 -z-10 bg-cover bg-center pointer-events-none",
				type === "picsum" ? "blur-[96px]" : "blur-[2px]",
				className
			)}
			style={{
				backgroundImage: `url(${imageUrl})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
			key={key}
		/>
	);
}
