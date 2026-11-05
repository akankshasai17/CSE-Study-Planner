import React from 'react';

const Badge = ({ type = 'default', text, className = '' }) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  const t = text ? text.toLowerCase() : '';

  if (t === 'high') {
    styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (t === 'medium') {
    styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (t === 'low') {
    styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (t === 'completed' || t === 'solved') {
    styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (t === 'in progress') {
    styleClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (t === 'pending' || t === 'not started') {
    styleClasses = 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (t === 'easy') {
    styleClasses = 'bg-emerald-50 text-emerald-600 border-emerald-200';
  } else if (t === 'hard') {
    styleClasses = 'bg-rose-50 text-rose-600 border-rose-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styleClasses} ${className}`}
    >
      {text}
    </span>
  );
};

export default Badge;
