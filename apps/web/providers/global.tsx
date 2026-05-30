"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import React, { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "~/components/ui/sonner";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
			gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
			refetchOnWindowFocus: true, // Refetch when user returns to window
			refetchOnMount: true, // Refetch when component mounts
			retry: 1, // Retry failed requests once
		},
		mutations: {
			onError: (error) => {
				// Display user-friendly error messages for all mutations
				toast.error(error.message || "An error occurred");
			},
		},
	},
});

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [createTRPCHttpBatchClientClient()],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<NextThemesProvider
				attribute="class"
				defaultTheme="dark"
				forcedTheme="dark"
				disableTransitionOnChange
			>
				<trpc.Provider queryClient={queryClient} client={trpcClient}>
					{children}
					<Toaster />
				</trpc.Provider>
			</NextThemesProvider>
		</QueryClientProvider>
	);
};
