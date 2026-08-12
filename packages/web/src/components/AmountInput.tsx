import { toKopecks } from '../lib/format';

export default function AmountInput({
  value,
  onChange,
  placeholder = '0',
  big = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  big?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className={`flex items-center ${big ? 'rounded-card bg-pagebg px-5 py-4' : ''}`}>
      {big && <span className={`mr-2 font-bold ${big ? 'text-3xl' : 'text-xl'}`}>₽</span>}
      <input
        inputMode="decimal"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent font-bold text-ink outline-none placeholder:text-muted/40 ${big ? 'text-4xl' : 'text-base'}`}
      />
      {!big && <span className="text-sm text-muted">₽</span>}
    </div>
  );
}

export function validAmount(value: string): number {
  return toKopecks(value);
}