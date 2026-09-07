export default function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="PATRON mark">
      <circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="91 30" strokeLinecap="square" transform="rotate(-38 24 24)" />
      <circle cx="24" cy="24" r="5.5" fill="currentColor" />
      <path d="M24 29.5V44" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}
