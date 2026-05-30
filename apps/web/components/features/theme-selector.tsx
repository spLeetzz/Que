"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { X, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { trpc } from "~/trpc/client";

interface ThemeSelectorProps {
	value: string | null;
	onChange: (theme: string | null) => void;
	disabled?: boolean;
}

interface UnsplashImage {
	id: string;
	urls: {
		small: string;
		regular: string;
	};
	alt_description: string | null;
	user: {
		name: string;
	};
}

export function ThemeSelector({ value, onChange, disabled }: ThemeSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState<UnsplashImage[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);

	const utils = trpc.useUtils();

	// Extract the actual URL from the theme value (remove "image:" prefix)
	const currentThemeUrl = value?.startsWith("image:") ? value.substring(6) : null;
	const currentThemeClass = value?.startsWith("class:") ? value.substring(6) : null;

	const handleSearch = async () => {
		if (!searchQuery.trim()) return;

		setIsSearching(true);
		setSearchError(null);

		try {
			const data = await utils.events.searchUnsplash.fetch({ query: searchQuery });
			
			const mappedImages: UnsplashImage[] = data.map((img) => ({
				id: img.id,
				urls: {
					small: img.thumb,
					regular: img.url,
				},
				alt_description: `Photo by ${img.author}`,
				user: {
					name: img.author,
				},
			}));
			setSearchResults(mappedImages);
		} catch (error) {
			setSearchError("Failed to search images");
			console.error(error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleSelectImage = (imageUrl: string) => {
		onChange(`image:${imageUrl}`);
	};

	const handleClearTheme = () => {
		onChange(null);
	};

	return (
		<div className="space-y-4">
			{/* Current Theme Preview */}
			{(currentThemeUrl || currentThemeClass) && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">Current Theme</Label>
					<div className="relative rounded-lg overflow-hidden border border-border">
						{currentThemeUrl ? (
							<div className="relative h-32 w-full">
								<Image
									src={currentThemeUrl}
									alt="Current theme"
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className={`h-32 w-full ${currentThemeClass}`} />
						)}
						<Button
							type="button"
							variant="destructive"
							size="sm"
							className="absolute top-2 right-2"
							onClick={handleClearTheme}
							disabled={disabled}
						>
							<X className="w-4 h-4 mr-1" />
							Clear
						</Button>
					</div>
				</div>
			)}

			{/* Unsplash Search */}
			<div className="space-y-2">
				<Label htmlFor="theme-search" className="text-sm font-medium">
					Search Background Images
				</Label>
				<div className="flex gap-2">
					<Input
						id="theme-search"
						placeholder="e.g., nature, abstract, gradient..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSearch();
							}
						}}
						disabled={disabled || isSearching}
					/>
					<Button
						type="button"
						onClick={handleSearch}
						disabled={disabled || isSearching || !searchQuery.trim()}
					>
						{isSearching ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Search className="w-4 h-4" />
						)}
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">
					Search for free images from Unsplash (no API key required)
				</p>
			</div>

			{/* Search Error */}
			{searchError && (
				<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
					{searchError}
				</div>
			)}

			{/* Search Results */}
			{searchResults.length > 0 && (
				<div className="space-y-2">
					<Label className="text-sm font-medium">Search Results</Label>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
						{searchResults.map((image) => (
							<button
								key={image.id}
								type="button"
								onClick={() => handleSelectImage(image.urls.regular)}
								disabled={disabled}
								className="relative aspect-video rounded-lg overflow-hidden border-2 border-border hover:border-primary hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
								aria-label={`Select ${image.alt_description || "image"} by ${image.user.name}`}
								tabIndex={0}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleSelectImage(image.urls.regular);
									}
								}}
							>
								<Image
									src={image.urls.small}
									alt={image.alt_description || "Unsplash image"}
									fill
									className="object-cover"
									loading="lazy"
								/>
							</button>
						))}
					</div>
					<p className="text-xs text-muted-foreground">
						Click an image to select it as your theme
					</p>
				</div>
			)}

			{/* CSS Class Input (Alternative) */}
			<div className="space-y-2">
				<Label htmlFor="theme-class" className="text-sm font-medium">
					Or Use a CSS Class
				</Label>
				<Input
					id="theme-class"
					placeholder="e.g., bg-gradient-to-br from-blue-500 to-purple-600"
					disabled={disabled}
					value={currentThemeClass || ""}
					onChange={(e) => {
						const classValue = e.target.value.trim();
						if (classValue) {
							onChange(`class:${classValue}`);
						} else {
							onChange(null);
						}
					}}
				/>
				<p className="text-xs text-muted-foreground">
					Enter Tailwind CSS classes for a custom gradient or color
				</p>
			</div>
		</div>
	);
}
