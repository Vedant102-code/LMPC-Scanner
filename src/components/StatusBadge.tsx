interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'severity';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="badge badge-neutral">
      {status}
    </span>
  );
}
