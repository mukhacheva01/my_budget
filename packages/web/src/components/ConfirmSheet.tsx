import Sheet from './Sheet';

export default function ConfirmSheet({
  open,
  title,
  text,
  confirmLabel = 'Удалить',
  danger = true,
  onConfirm,
  onClose,
  busy = false,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-card bg-pagebg py-3.5 font-semibold text-ink"
        >
          Отмена
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 rounded-card py-3.5 font-semibold text-white disabled:opacity-50 ${
            danger ? 'bg-smokyrose' : 'bg-rosytaupe'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}