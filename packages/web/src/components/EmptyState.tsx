interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <span className="text-4xl mb-3">{emoji}</span>
      <p className="text-lg font-semibold text-text">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-full bg-rosytaupe px-6 py-2.5 text-sm font-semibold text-white shadow-card"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
