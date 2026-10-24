'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
export function Select({ label, value, onChange, options, }) {
    const [open, setOpen] = useState(false), [active, setActive] = useState(0);
    const ref = useRef(null);
    const button = useRef(null);
    useEffect(() => {
        const outside = (event) => {
            if (!ref.current?.contains(event.target))
                setOpen(false);
        };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, []);
    const choose = (index) => {
        if (options[index])
            onChange(options[index].value);
        setOpen(false);
        button.current?.focus();
    };
    return (_jsxs("div", { className: "admin-select", ref: ref, children: [_jsx("span", { className: "admin-label", children: label }), _jsxs("button", { type: "button", ref: button, role: "combobox", "aria-label": label, "aria-expanded": open, "aria-controls": label.replaceAll(' ', '-'), "aria-activedescendant": open ? label.replaceAll(' ', '-') + '-' + active : undefined, onClick: () => {
                    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
                    setOpen(!open);
                }, onKeyDown: (event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpen(false);
                    }
                    if (event.key === 'Tab')
                        setOpen(false);
                    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                        event.preventDefault();
                        setOpen(true);
                        setActive(event.key === 'Home'
                            ? 0
                            : event.key === 'End'
                                ? options.length - 1
                                : Math.max(0, Math.min(options.length - 1, active + (event.key === 'ArrowUp' ? -1 : 1))));
                    }
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        open ? choose(active) : setOpen(true);
                    }
                }, className: "admin-input flex items-center justify-between gap-3", children: [_jsx("span", { children: options.find((o) => o.value === value)?.label || 'Selecione' }), _jsx("span", { "aria-hidden": true, children: "\u2304" })] }), open && (_jsx("div", { id: label.replaceAll(' ', '-'), role: "listbox", "aria-label": label, className: "admin-options", children: options.map((option, index) => (_jsx("button", { type: "button", role: "option", id: label.replaceAll(' ', '-') + '-' + index, "aria-selected": option.value === value, className: active === index ? 'highlighted' : '', onClick: () => choose(index), children: option.label }, option.value))) }))] }));
}
