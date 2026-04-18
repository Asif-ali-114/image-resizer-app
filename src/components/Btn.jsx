export default function Btn({ children, onClick, disabled, variant = "primary", size = "md", small = false, className = "", style, ...rest }) {
  const baseClasses = "font-bold transition-all duration-200 rounded-lg font-headline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-primary text-on-primary hover:bg-primary-dim shadow-sm hover:shadow-md",
    secondary: "bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container transition-colors",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
    danger: "bg-error/10 text-error border border-error/20 hover:bg-error/20",
    ghost: "text-primary hover:bg-primary/5 border border-outline-variant/30",
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
