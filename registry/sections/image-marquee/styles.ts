/**
 * The image marquee's stylesheet, added once per document: a coloured band
 * of rows, each a line of words and images too long for the screen. The
 * engine repeats each row's items to fill it and moves the rows with
 * `transform` only.
 */
export const IMAGE_MARQUEE_STYLE_ID = "sg-image-marquee";

export const imageMarqueeStyles = /* css */ `
.sg-im {
	--sg-im-band: oklch(0.93 0.19 122);
	--sg-im-ink: #111114;
	position: relative;
	overflow: clip;
	background: var(--background, #f6f6f4);
}
.sg-im-band {
	display: flex; flex-direction: column; gap: clamp(4px, 1vw, 12px);
	padding: clamp(28px, 5vw, 64px) 0;
	color: var(--sg-im-ink);
	background: var(--sg-im-band);
}
.sg-im-row { overflow: hidden; }
.sg-im-row[hidden] { display: none; }
.sg-im-track {
	display: flex; align-items: center; gap: .32em; width: max-content;
	margin: 0; padding: 0 .16em; list-style: none;
	font-size: clamp(44px, 8vw, 128px); line-height: 1.1; font-weight: 600; letter-spacing: -0.04em; white-space: nowrap;
}
.sg-im-track li { flex: none; }
.sg-im-pic { display: block; width: 1.12em; height: .78em; overflow: hidden; border-radius: .2em; transform: rotate(-4deg); }
.sg-im-pic:nth-of-type(4n + 2) { transform: rotate(5deg); }
.sg-im-pic img { display: block; width: 100%; height: 100%; object-fit: cover; }
`;
