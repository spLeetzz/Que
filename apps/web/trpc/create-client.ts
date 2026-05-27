import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
	enableStreaming?: boolean;
}

export const getTrpcUrl = () => {
	if (env.NEXT_PUBLIC_API_URL) {
		return `${env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/trpc`;
	}
	return "http://localhost:8000/trpc";
};

export const createTRPCHttpBatchClientClient = (
	opts?: CreateTRPCHttpBatchClientClientOpts,
) => {
	const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
	return c({
		url: getTrpcUrl(),
		fetch(url, options) {
			return fetch(url, {
				...options,
				credentials: "include",
			});
		},
	});
};
