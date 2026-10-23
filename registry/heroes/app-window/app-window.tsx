import type { DomHero } from "@/lib/sharingan";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { chartPaths, createAppWindow } from "./engine";
import { appWindowExample } from "./example";
import type { AppWindowConfigInput, AppWindowContent } from "./schema";
import { APP_WINDOW_STYLE_ID, appWindowStyles } from "./styles";

export type AppWindowHeroProps = {
	content?: AppWindowContent;
	config?: AppWindowConfigInput;
	id?: string;
	className?: string;
};

/**
 * App window (Sharingan, DOM engine). Your product's screen, drawn in HTML,
 * builds itself panel by panel, then leans toward the pointer. The screen is
 * one image for assistive technology (`app.label`), its parts are decoration.
 */
export function AppWindowHero({ content = appWindowExample, config, id = "hero", className }: AppWindowHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<AppWindowConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createAppWindow({ host: section.current, config: JSON.parse(configKey) });
		return () => {
			engine.current?.destroy();
			engine.current = null;
		};
		// The engine starts once per content; config changes go through setConfig below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [content]);

	useEffect(() => {
		engine.current?.setConfig(JSON.parse(configKey));
	}, [configKey]);

	const { app } = content;
	const chart = useMemo(() => chartPaths(app.chart.points), [app.chart.points]);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="app-window" className={["sg-aw", className].filter(Boolean).join(" ")}>
			<style href={APP_WINDOW_STYLE_ID} precedence="default">
				{appWindowStyles}
			</style>
			<div className="sg-aw-copy">
				{content.eyebrow && <p className="sg-aw-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p>{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-aw-ctas">
						{content.primaryCta && (
							<a className="sg-aw-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-aw-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>

			<div className="sg-aw-stage">
				<div className="sg-aw-window" data-sg-window="" role="img" aria-label={app.label}>
					<div className="sg-aw-chrome" data-sg-panel="" aria-hidden="true">
						<i />
						<i />
						<i />
						<span className="sg-aw-address">{app.name.toLowerCase()}.app</span>
					</div>
					<div className="sg-aw-app" aria-hidden="true">
						<aside className="sg-aw-side" data-sg-panel="">
							<span className="sg-aw-brand">{app.name}</span>
							{app.nav.map((item, index) => (
								<span key={item} className="sg-aw-nav" data-current={index === 0 ? "" : undefined}>
									{item}
								</span>
							))}
						</aside>
						<div className="sg-aw-main">
							<div className="sg-aw-head" data-sg-panel="">
								<h3>{app.title}</h3>
								<span className="sg-aw-button">Deploy</span>
							</div>
							<div className="sg-aw-stats">
								{app.stats.map((stat) => (
									<div key={stat.label} className="sg-aw-card" data-sg-panel="" data-depth="3">
										<div className="sg-aw-stat-label">{stat.label}</div>
										<div className="sg-aw-stat-value">
											<span data-sg-count="">{stat.value}</span>
											{stat.delta && (
												<span className="sg-aw-delta" data-down={/^[−-]/.test(stat.delta) ? "" : undefined}>
													{stat.delta}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
							<div className="sg-aw-card sg-aw-chart" data-sg-panel="" data-sg-chart="" data-depth="1">
								<div className="sg-aw-stat-label">{app.chart.label}</div>
								<svg viewBox={chart.viewBox} preserveAspectRatio="none">
									<path className="sg-aw-grid" d="M0 13H100M0 26H100" />
									<path className="sg-aw-area" d={chart.area} />
									<path className="sg-aw-line" d={chart.line} />
								</svg>
							</div>
							<div className="sg-aw-card sg-aw-table" data-sg-panel="" data-depth="2" style={{ "--cols": app.columns.length } as CSSProperties}>
								<div className="sg-aw-tr">
									{app.columns.map((column) => (
										<span key={column}>{column}</span>
									))}
								</div>
								{app.rows.map((row, index) => (
									<div key={index} className="sg-aw-tr" data-sg-row="">
										{row.cells.map((cell, position) =>
											position === 1 ? (
												<span key={position} className="sg-aw-badge" data-status={row.status ?? "neutral"}>
													{cell}
												</span>
											) : (
												<span key={position}>{cell}</span>
											),
										)}
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
