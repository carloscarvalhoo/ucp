'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from './model';
export function AccountForm({ user, onSaved, onDirty, }) {
    const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    return (_jsxs("form", { className: "admin-form", onChange: onDirty, onSubmit: async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = Object.fromEntries(new FormData(form));
            setBusy(true);
            try {
                await api('account', 'PUT', data);
                onSaved(String(data.name).trim());
                setMessage('Configurações salvas.');
            }
            catch (error) {
                setMessage(error.message);
            }
            finally {
                setBusy(false);
            }
        }, children: [_jsxs("label", { children: ["Seu nome", _jsx("input", { name: "name", defaultValue: user.name, required: true, maxLength: 150, autoComplete: "name" })] }), _jsxs("label", { children: ["E-mail de acesso", _jsx("input", { value: user.email, readOnly: true })] }), _jsx("p", { role: "status", children: message }), _jsx("button", { className: "admin-primary", disabled: busy, children: busy ? 'Salvando…' : 'Salvar configurações' })] }));
}
