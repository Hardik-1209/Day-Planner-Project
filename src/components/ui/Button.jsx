import React, { forwardRef } from 'react';

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'secondary', // 'primary' | 'secondary' | 'ghost'
    size = 'md',          // 'xs' | 'sm' | 'md'
    icon: Icon = null,
    iconRight: IconRight = null,
    className = '',
    disabled = false,
    type = 'button',
    onClick,
    title,
    style,
    ...props
  },
  ref
) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'xs' ? 'btn-xs' : size === 'sm' ? 'btn-sm' : '';
  const isIconOnly = !children && Icon;
  const iconOnlyClass = isIconOnly ? (size === 'xs' ? 'btn-icon-xs' : size === 'sm' ? 'btn-icon-sm' : 'btn-icon') : '';

  return (
    <button
      ref={ref}
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${iconOnlyClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      title={title}
      style={style}
      {...props}
    >
      {Icon && <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : 15} strokeWidth={1.75} />}
      {children}
      {IconRight && <IconRight size={size === 'xs' ? 12 : size === 'sm' ? 14 : 15} strokeWidth={1.75} />}
    </button>
  );
});

