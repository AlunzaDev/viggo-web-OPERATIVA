type CrudStatusVariant = "active" | "inactive" | "pending" | "error" | "free";

type CrudStatusBadgeProps = {
  label: string;
  variant?: CrudStatusVariant;
};

export function CrudStatusBadge({
  label,
  variant = "inactive",
}: CrudStatusBadgeProps) {
  return (
    <span className={`admin-crud-status admin-crud-status--${variant}`}>
      {label}
    </span>
  );
}
