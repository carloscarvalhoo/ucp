'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Modal } from './modal';
const ConfirmationContext = createContext(() => Promise.resolve(false));
export function ConfirmationProvider({ children }) {
    const [message, setMessage] = useState(null);
    const pending = useRef(null);
    const confirm = useCallback((text) => new Promise((resolve) => {
        pending.current?.(false);
        pending.current = resolve;
        setMessage(text);
    }), []);
    const finish = useCallback((accepted) => {
        pending.current?.(accepted);
        pending.current = null;
        setMessage(null);
    }, []);
    useEffect(() => () => {
        pending.current?.(false);
    }, []);
    return (_jsxs(ConfirmationContext.Provider, { value: confirm, children: [children, message !== null && (_jsxs(Modal, { title: "Confirmar a\u00E7\u00E3o", onClose: () => finish(false), children: [_jsx("p", { className: "mb-6 leading-relaxed", children: message }), _jsxs("div", { className: "flex flex-wrap justify-end gap-3", children: [_jsx("button", { type: "button", className: "admin-button", autoFocus: true, onClick: () => finish(false), children: "Cancelar" }), _jsx("button", { type: "button", className: "admin-primary", onClick: () => finish(true), children: "Confirmar" })] })] }))] }));
}
export function useConfirmation() {
    return useContext(ConfirmationContext);
}
