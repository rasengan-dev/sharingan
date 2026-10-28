import { defineDomElement } from "@/lib/sharingan";
import { createSkyLaunch } from "./engine";
import type { SkyLaunchConfigInput } from "./schema";

/** `<sg-sky-launch>`: Sky launch for any page, no framework. Its children are the hero's copy; the sky is added behind them. */
export function defineSkyLaunchElement(tag = "sg-sky-launch") {
	defineDomElement<SkyLaunchConfigInput>({
		tag,
		attributes: { sun: "string", sky: "string", clouds: "string", rocket: "boolean", launch: "number", exit: "boolean" },
		create: createSkyLaunch,
	});
}
