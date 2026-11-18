/**
 * The one QualiFi logo: a path-drawn "q" mark (no font dependency, identical everywhere) and the
 * wordmark in the display face. public/favicon.svg uses the same geometry.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="11" fill="#16302a" />
      <circle cx="17.5" cy="19" r="7" fill="none" stroke="#d6ee9e" strokeWidth="4.5" />
      <rect x="22.25" y="12" width="4.5" height="20" rx="2.25" fill="#d6ee9e" />
      <circle cx="31" cy="9.5" r="2.75" fill="#d6ee9e" />
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
