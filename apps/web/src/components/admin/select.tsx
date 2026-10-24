'use client';
import { useEffect, useRef, useState } from 'react';
type Option = { value: string; label: string };
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, []);
  const choose = (index: number) => {
    if (options[index]) onChange(options[index].value);
    setOpen(false);
    button.current?.focus();
  };
  return (
    <div className="admin-select" ref={ref}>
      <span className="admin-label">{label}</span>
      <button
        type="button"
        ref={button}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={label.replaceAll(' ', '-')}
        aria-activedescendant={open ? label.replaceAll(' ', '-') + '-' + active : undefined}
        onClick={() => {
          setActive(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
          if (event.key === 'Tab') setOpen(false);
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
            setActive(
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? options.length - 1
                  : Math.max(
                      0,
                      Math.min(options.length - 1, active + (event.key === 'ArrowUp' ? -1 : 1)),
                    ),
            );
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open ? choose(active) : setOpen(true);
          }
        }}
        className="admin-input flex items-center justify-between gap-3"
      >
        <span>{options.find((o) => o.value === value)?.label || 'Selecione'}</span>
        <span aria-hidden>⌄</span>
      </button>
      {open && (
        <div
          id={label.replaceAll(' ', '-')}
          role="listbox"
          aria-label={label}
          className="admin-options"
        >
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              id={label.replaceAll(' ', '-') + '-' + index}
              aria-selected={option.value === value}
              key={option.value}
              className={active === index ? 'highlighted' : ''}
              onClick={() => choose(index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
