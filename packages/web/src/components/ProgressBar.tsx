export default function ProgressBar({
  value, // 0..1+
  color = '#B09398',
  height = 8,
  className = '',
}: {
  value: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-ink/5 ${className}`}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}