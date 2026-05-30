"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { X, Search, Loader2, Image as ImageIcon } from "lucide-react";
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
	const [showSearch, setShowSearch] = useState(false);

	const utils = trpc.useUtils();

	// Extract the actual URL from the theme value (remove "image:" prefix)
	const currentThemeUrl = value?.startsWith("image:") ? value.substring(6) : null;

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
			setSearchError("Failed to search images. Please try again.");
			console.error("[v0] Unsplash search error:", error);
		} finally {
			setIsSearching(false);
		}
	};

	const handleSelectImage = (imageUrl: string) => {
		onChange(`image:${imageUrl}`);
	};

	const handleClearTheme = () => {
		onChange(null);
		setShowSearch(false);
		setSearchQuery("");
		setSearchResults([]);
	};

	return (
		<div className="space-y-6">
			{/* Current Theme Preview */}
			{currentThemeUrl ? (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-semibold">Current Background</Label>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleClearTheme}
							disabled={disabled}
							className="h-7 px-2 text-xs"
						>
							<X className="h-3 w-3 mr-1" />
							Change
						</Button>
					</div>
					<div className="relative rounded-xl overflow-hidden border border-border shadow-sm h-40">
						<Image
							src={currentThemeUrl}
							alt="Current theme"
							fill
							className="object-cover"
							priority
						/>
					</div>
				</div>
			) : (
				<div className="space-y-3">
					<Label className="text-sm font-semibold">Background</Label>
					<button
						type="button"
						onClick={() => setShowSearch(!showSearch)}
						disabled={disabled}
						className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/2 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
					>
						<ImageIcon className="h-8 w-8 text-muted-foreground" />
						<span className="text-sm font-medium text-muted-foreground">Add Background Image</span>
					</button>
				</div>
			)}

			{/* Unsplash Search */}
			{showSearch && (
				<div className="space-y-3 pt-4 border-t border-border">
					<Label htmlFor="theme-search" className="text-sm font-semibold">
						Search Unsplash
					</Label>
					<div className="flex gap-2">
						<Input
							id="theme-search"
							placeholder="Nature, sunset, abstract..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleSearch();
								}
							}}
							disabled={disabled || isSearching}
							className="h-9"
						/>
						<Button
							type="button"
							onClick={handleSearch}
							disabled={disabled || isSearching || !searchQuery.trim()}
							size="sm"
							className="px-3"
						>
							{isSearching ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Search className="h-4 w-4" />
							)}
						</Button>
					</div>

					{/* Search Error */}
					{searchError && (
						<div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
							{searchError}
						</div>
					)}

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className="space-y-2">
							<p className="text-xs text-muted-foreground font-medium">
								{searchResults.length} results found
							</p>
							<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
								{searchResults.map((image) => (
									<button
										key={image.id}
										type="button"
										onClick={() => {
											handleSelectImage(image.urls.regular);
											setShowSearch(false);
											setSearchQuery("");
											setSearchResults([]);
										}}
										disabled={disabled}
										className="relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
										aria-label={`Select ${image.user.name}'s photo`}
										title={`by ${image.user.name}`}
									>
										<Image
											src={image.urls.small}
											alt={`by ${image.user.name}`}
											fill
											className="object-cover"
											loading="lazy"
										/>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
