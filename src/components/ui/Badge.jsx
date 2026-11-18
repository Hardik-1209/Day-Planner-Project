import React from 'react';

export function Badge({
  children,
  variant = 'default', // 'default' | 'deep_work' | 'meetings' | 'admin' | 'personal' | 'break' | 'rollover' | 'big_rock'
  size = 'sm',
  className = '',
  style = {},
}) {
  let badgeStyle = { ...style };
  let extraClass = '';

  if (variant === 'deep_work') {
    badgeStyle.backgroundColor = 'var(--cat-deep-bg)';
    badgeStyle.color = 'var(--cat-deep-text)';
    badgeStyle.border = '1px solid var(--cat-deep-spine)';
  } else if (variant === 'meetings') {
    badgeStyle.backgroundColor = 'var(--cat-meeting-bg)';
    badgeStyle.color = 'var(--cat-meeting-text)';
    badgeStyle.border = '1px solid var(--cat-meeting-spine)';
  } else if (variant === 'admin') {
    badgeStyle.backgroundColor = 'var(--cat-admin-bg)';
    badgeStyle.color = 'var(--cat-admin-text)';
    badgeStyle.border = '1px solid var(--cat-admin-spine)';
  } else if (variant === 'personal') {
    badgeStyle.backgroundColor = 'var(--cat-personal-bg)';
    badgeStyle.color = 'var(--cat-personal-text)';
    badgeStyle.border = '1px solid var(--cat-personal-spine)';
  } else if (variant === 'break') {
    badgeStyle.backgroundColor = 'var(--cat-break-bg)';
    badgeStyle.color = 'var(--cat-break-text)';
    badgeStyle.border = '1px solid var(--cat-break-spine)';
  } else if (variant === 'rollover') {
    badgeStyle.backgroundColor = 'rgba(229, 77, 46, 0.12)';
    badgeStyle.color = 'var(--signal-now)';
    badgeStyle.border = '1px solid var(--signal-now)';
  } else if (variant === 'big_rock') {
    badgeStyle.backgroundColor = 'var(--accent-primary)';
    badgeStyle.color = 'var(--accent-contrast-text)';
  } else {
    badgeStyle.backgroundColor = 'var(--bg-hover)';
    badgeStyle.color = 'var(--text-secondary)';
    badgeStyle.border = '1px solid var(--border-hairline)';
  }

  return (
    <span className={`badge tabular-nums ${extraClass} ${className}`.trim()} style={badgeStyle}>
      {children}
    </span>
  );
}

