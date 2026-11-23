/**
 * The one QualiFi logo: the masquerade-mask mark (dark tile, lime mask, spark above; the right eye
 * is a "q") drawn with paths, and the wordmark in the display face. public/favicon.svg, the PWA
 * icons and the presentation use the same geometry. Eye holes are painted in the tile colour,
 * so no SVG ids are needed when several logos share a page.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
      <rect width="1024" height="1024" rx="236" fill="#16302a" />
      <g transform="translate(112 330) scale(3.64)">
        <path d="M2,14 C34,34 72,24 110,42 C148,24 186,34 218,14 C218,66 196,106 150,108 C128,109 117,99 110,86 C103,99 92,109 70,108 C24,106 2,66 2,14 Z" fill="#d6ee9e" />
        <path d="M40,66 C52,48 80,46 94,62 C80,78 52,80 40,66 Z" fill="#16302a" />
        <circle cx="150" cy="64" r="16" fill="#16302a" />
        <path d="M158,73 L171,91 L179,85 L166,68 Z" fill="#16302a" />
        <path d="M110,-26 C112,-14 116,-10 128,-8 C116,-6 112,-2 110,10 C108,-2 104,-6 92,-8 C104,-10 108,-14 110,-26 Z" fill="#8fbf4d" />
      </g>
    </svg>
  );
}

export function Logo({ size = 28, href = "/", label = "QualiFi", className }: { size?: number; href?: string | null; label?: string; className?: string }) {
  const body = (
    <>
      <LogoMark size={size} />
      <span className="logo__word">QualiFi</span>
    </>
  );
  return href ? (
    <a className={`logo${className ? ` ${className}` : ""}`} href={href} aria-label={label}>
      {body}
    </a>
  ) : (
    <span className={`logo${className ? ` ${className}` : ""}`}>{body}</span>
  );
}
