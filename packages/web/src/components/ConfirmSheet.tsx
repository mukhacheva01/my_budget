import Sheet from './Sheet';

export default function ConfirmSheet({
  open,
  title,
  text,
  description,
  confirmLabel = '\u0423\u0434\u0430\u043b\u0438\u0442\u044c',
  danger = false,
  destructive = false,
  onConfirm,
  onClose,
  busy = false,
}: {
  open: boolean;
  title: string;
  text?: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const isDanger = danger || destructive;
  const displayText = text || description || '';

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-muted">{displayText}</p>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-card bg-pagebg py-3.5 font-semibold text-ink dark:bg-zinc-700 dark:text-white"
        >
          \u041e\u0442\u043c\u0435\u043d\u0430
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 rounded-card py-3.5 font-semibold text-white disabled:opacity-50 ${
            isDanger ? 'bg-red-500' : 'bg-rosytaupe'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
