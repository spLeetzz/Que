import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Que",
	description: "Polls, Forms & Banter",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="dark" style={{ colorScheme: 'dark' }}>
			<body className={inter.variable}>
				<GlobalProviders>{children}</GlobalProviders>
			</body>
		</html>
	);
}
