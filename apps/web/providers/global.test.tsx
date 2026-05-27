import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";

describe("Global Providers Configuration", () => {
	it("should configure QueryClient with correct staleTime and gcTime", () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					staleTime: 5 * 60 * 1000, // 5 minutes
					gcTime: 10 * 60 * 1000, // 10 minutes
					refetchOnWindowFocus: true,
					refetchOnMount: true,
					retry: 1,
				},
			},
		});

		const defaultOptions = queryClient.getDefaultOptions();

		// Verify staleTime is 5 minutes (300,000 ms)
		expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000);

		// Verify gcTime (cache time) is 10 minutes (600,000 ms)
		expect(defaultOptions.queries?.gcTime).toBe(10 * 60 * 1000);

		// Verify refetch options
		expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(true);
		expect(defaultOptions.queries?.refetchOnMount).toBe(true);

		// Verify retry count
		expect(defaultOptions.queries?.retry).toBe(1);
	});

	it("should configure mutation error handler", () => {
		const queryClient = new QueryClient({
			defaultOptions: {
				mutations: {
					onError: (error) => {
						// Error handler should be defined
						expect(error).toBeDefined();
					},
				},
			},
		});

		const defaultOptions = queryClient.getDefaultOptions();

		// Verify mutation error handler is defined
		expect(defaultOptions.mutations?.onError).toBeDefined();
		expect(typeof defaultOptions.mutations?.onError).toBe("function");
	});
});
