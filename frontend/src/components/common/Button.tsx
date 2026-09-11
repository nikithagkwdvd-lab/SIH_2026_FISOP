import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-gov-primary text-white hover:bg-gov-primary-hover focus:ring-gov-primary border border-transparent shadow-sm',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 border border-slate-300',
    outline:
      'bg-white text-gov-primary hover:bg-slate-50 focus:ring-gov-primary border border-gov-primary',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-600 border border-transparent shadow-sm',
    success:
      'bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-600 border border-transparent shadow-sm',
    ghost:
      'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400 border border-transparent',
  };

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-base px-4 py-2 gap-2 min-h-[44px]',
    lg: 'text-lg px-6 py-3 gap-2.5 min-h-[48px]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
