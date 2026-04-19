export default function Btn({ children, onClick, disabled, variant = "primary", size = "md", small = false, className = "", style, ...rest }) {
  const baseClasses = "font-body rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-8 py-3 text-base",
  };

  const variantClasses = {
    primary: "border border-transparent bg-[var(--color-accent-primary)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-accent)] active:translate-y-0 active:bg-[var(--color-accent-hover)] active:shadow-none focus:shadow-[var(--shadow-focus)] disabled:bg-[var(--color-gray-200)] disabled:text-[var(--color-gray-400)] disabled:shadow-none",
    secondary: "bg-[var(--color-base-0)] text-[var(--color-text-secondary)] border border-[var(--color-base-300)] shadow-[0_1px_2px_rgba(15,15,20,0.05)] hover:bg-[var(--color-base-100)] hover:border-[var(--color-base-400)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-base-150)] focus:shadow-[var(--shadow-focus)]",
    success: "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success-border)] hover:brightness-95 focus:shadow-[var(--shadow-focus)]",
    danger: "bg-[var(--color-error-light)] text-[var(--color-error)] border border-[var(--color-error-border)] hover:brightness-95 focus:shadow-[var(--shadow-focus)]",
    ghost: "bg-transparent border border-transparent text-[var(--color-text-tertiary)] hover:bg-[var(--color-base-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-base-150)] focus:shadow-[var(--shadow-focus)]",
  };

  const resolvedSize = small ? "sm" : size;
  const cls = `${baseClasses} ${sizeClasses[resolvedSize] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cls}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
