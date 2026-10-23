import type { AppWindowContent } from "./schema";

/** A hosting dashboard for a made-up product, Relay. The numbers are made up too. */
export const appWindowExample: AppWindowContent = {
	eyebrow: "Relay · hosting dashboard",
	headline: "Every deploy, every domain, on one screen",
	subheadline: "Builds stream live, rollbacks take one click, and your traffic sits next to the commit that changed it.",
	primaryCta: { label: "Start for free", href: "#start" },
	secondaryCta: { label: "Read the docs", href: "#docs" },
	app: {
		label: "Example Relay dashboard for a project called storefront: request and bandwidth figures, a 24-hour traffic chart and the latest deployments.",
		name: "Relay",
		nav: ["Overview", "Deployments", "Domains", "Environment", "Team", "Settings"],
		title: "storefront",
		stats: [
			{ label: "Requests, 24h", value: "1.2M", delta: "+8%" },
			{ label: "Bandwidth", value: "84 GB", delta: "+3%" },
			{ label: "Deploys this week", value: "37" },
			{ label: "p95 latency", value: "42 ms", delta: "−6%" },
		],
		chart: { label: "Requests, last 24 hours", points: [32, 28, 24, 22, 25, 34, 48, 62, 70, 74, 71, 76, 82, 79, 85, 92, 88, 80, 72, 66, 58, 50, 44, 38] },
		columns: ["Commit", "Status", "Branch", "Duration", "When"],
		rows: [
			{ cells: ["a41c9e2", "Live", "main", "12.4s", "now"], status: "ok" },
			{ cells: ["7be03d1", "Ready", "main", "13.1s", "2h"], status: "neutral" },
			{ cells: ["19fa6c0", "Ready", "feat/cart", "11.8s", "1d"], status: "neutral" },
			{ cells: ["0c3d2aa", "Failed", "main", "4.2s", "2d"], status: "error" },
		],
	},
};
