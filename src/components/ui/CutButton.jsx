// Angled "cut-corner" button from the security/8-bit template (clip-path bevel).
// The shared, reusable button for the HomePixel design language.
//
// Props:
//   variant: "solid"   — brand orange fill (default)
//            "inverse" — foreground/background fill (black in light, white in dark)
//            "outline" — bordered shell with a transparent inner fill
//   size:    "md" (h-10, default) | "lg" (h-12)
//   iconOnly, fullWidth, cut (bevel px), className, plus any button/anchor props.
//   innerClassName: extra classes for the inner element of the "outline" variant
//                   (e.g. to override its fill, like a white Google button in dark).
// Pass `href` to render an <a>, otherwise a <button> (forwards onClick, type,
// disabled, onMouseEnter/Leave, etc.). Internal routes ("/...") render a Next
// <Link> for client-side navigation (no full reload / flash of the prior page);
// hash and external hrefs stay plain <a>.

import Link from "next/link";

const CUT =
  "[clip-path:polygon(var(--cut)_0,100%_0,100%_calc(100%-var(--cut)),calc(100%-var(--cut))_100%,0_100%,0_var(--cut))]";

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 text-sm font-medium tracking-wide transition-colors duration-200 focus-ring disabled:cursor-not-allowed disabled:opacity-50";

const HEIGHTS = { md: "h-10", lg: "h-12" };
const WIDTHS = { md: "w-10", lg: "w-12" };

const FILL = {
  // `disabled:hover:*` pins the base color so a disabled button doesn't lighten
  // on hover; the dimming comes from `disabled:opacity-50` in BASE.
  solid: "bg-[#ff4f01] text-white hover:bg-[#ff6326] disabled:hover:bg-[#ff4f01]",
  inverse: "bg-foreground text-background hover:bg-foreground/85 disabled:hover:bg-foreground",
};

export function CutButton({
  variant = "solid",
  size = "md",
  iconOnly = false,
  fullWidth = false,
  cut = 9,
  className = "",
  innerClassName = "",
  children,
  ...props
}) {
  const cutVar = { "--cut": `${cut}px` };
  const isAnchor = "href" in props && props.href !== undefined;
  // Internal app routes use Next's Link for client-side navigation; hash
  // anchors and external URLs fall back to a plain <a>.
  const isInternal = isAnchor && typeof props.href === "string" && props.href.startsWith("/");
  const h = HEIGHTS[size] ?? HEIGHTS.md;
  const w = WIDTHS[size] ?? WIDTHS.md;

  // Filled variants (solid / inverse) — a single clipped element.
  if (variant === "solid" || variant === "inverse") {
    const sizeCls = iconOnly ? `${h} ${w}` : `${h} px-5 ${fullWidth ? "w-full" : ""}`;
    const cls = `${BASE} ${sizeCls} ${CUT} ${FILL[variant] ?? FILL.solid} ${className}`;

    if (isAnchor) {
      const { href, ...rest } = props;
      const Tag = isInternal ? Link : "a";
      return (
        <Tag href={href} style={cutVar} className={cls} {...rest}>
          {children}
        </Tag>
      );
    }
    return (
      <button style={cutVar} className={cls} {...props}>
        {children}
      </button>
    );
  }

  // Outline — bordered shell (bg-border) + transparent inner fill, so the border
  // follows the beveled corners.
  const wrapperSize = iconOnly ? `${h} ${w}` : `${h} ${fullWidth ? "w-full" : ""}`;
  const wrapper = `inline-flex ${wrapperSize} bg-border p-px ${CUT} ${className}`;
  const innerSize = iconOnly ? "w-full" : `px-5 ${fullWidth ? "w-full" : ""}`;
  const inner = `${BASE} h-full ${innerSize} ${CUT} bg-background text-foreground hover:bg-muted ${innerClassName}`;

  if (isAnchor) {
    const { href, ...rest } = props;
    const Tag = isInternal ? Link : "a";
    return (
      <span style={cutVar} className={wrapper}>
        <Tag href={href} style={cutVar} className={inner} {...rest}>
          {children}
        </Tag>
      </span>
    );
  }
  return (
    <span style={cutVar} className={wrapper}>
      <button style={cutVar} className={inner} {...props}>
        {children}
      </button>
    </span>
  );
}
