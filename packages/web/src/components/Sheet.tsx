import { useEffect, useState, type ReactNode } from 'react';

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) setVisible(true);
  }, [open]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="sheet-backdrop absolute inset-0 bg-ink/30"
        onClick={() => {
          setVisible(false);
          window.setTimeout(onClose, 180);
        }}
      />
      <div className="sheet-panel relative w-full max-w-md rounded-t-[32px] bg-white p-5 pb-8 shadow-card">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/10" />
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}