export default function Btn({ children, onClick, disabled, variant = "primary", size = "md", small = false, className = "", style, ...rest }) {
  const baseClasses = "ui-btn inline-flex items-center justify-center gap-2 whitespace-nowrap font-body rounded-lg text-sm font-medium leading-none transition-[transform,box-shadow,background-color,border-color,color] duration-150 focus:outline-none disabled:cursor-not-allowed active:translate-y-px";

  const sizeClasses = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
  };

  const variantClasses = {
    primary: "border border-transparent bg-[var(--color-accent-primary)] text-white shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-accent)] active:bg-[var(--color-accent-hover)] active:shadow-none focus:shadow-[var(--shadow-focus)] disabled:bg-[var(--color-gray-200)] disabled:text-[var(--color-gray-400)] disabled:shadow-none",
    secondary: "bg-[var(--color-base-0)] text-[var(--color-text-secondary)] border border-[var(--color-base-300)] shadow-[0_1px_2px_rgba(15,15,20,0.05)] hover:-translate-y-px hover:bg-[var(--color-base-100)] hover:border-[var(--color-base-400)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-base-150)] focus:shadow-[var(--shadow-focus)]",
    success: "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success-border)] hover:-translate-y-px hover:brightness-95 focus:shadow-[var(--shadow-focus)]",
    danger: "bg-[var(--color-error-light)] text-[var(--color-error)] border border-[var(--color-error-border)] hover:-translate-y-px hover:brightness-95 focus:shadow-[var(--shadow-focus)]",
    ghost: "bg-transparent border border-transparent text-[var(--color-text-tertiary)] hover:-translate-y-px hover:bg-[var(--color-base-100)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-base-150)] focus:shadow-[var(--shadow-focus)]",
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
