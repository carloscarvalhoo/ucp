'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useId } from 'react';
export function Modal({ title, onClose, children, wide = false, }) {
    const titleId = useId();
    const ref = useRef(null), outside = useRef(false);
    useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        return () => dialog.close();
    }, []);
    function isOutside(event) {
        const r = ref.current.getBoundingClientRect();
        return (event.target === ref.current &&
            (event.clientX < r.left ||
                event.clientX > r.right ||
                event.clientY < r.top ||
                event.clientY > r.bottom));
    }
    return (_jsxs("dialog", { ref: ref, "aria-labelledby": titleId, className: 'admin-modal ' + (wide ? 'wide' : ''), onCancel: (e) => {
            e.preventDefault();
            onClose();
        }, onPointerDown: (e) => {
            outside.current = isOutside(e);
        }, onClick: (e) => {
            if (outside.current && isOutside(e))
                onClose();
            outside.current = false;
        }, children: [_jsxs("header", { className: "flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-5", children: [_jsx("h2", { id: titleId, className: "text-xl font-semibold", children: title }), _jsx("button", { className: "admin-icon-button", onClick: onClose, "aria-label": "Fechar", children: "\u2715" })] }), _jsx("div", { className: "p-6", children: children })] }));
}
