import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfirmationProvider, useConfirmation } from './confirmation';
function Demo() { const confirm = useConfirmation(); const [result, setResult] = useState('Nenhuma ação executada.'); return _jsxs("main", { className: "admin-shell", style: { padding: '48px' }, children: [_jsx("p", { children: "TESTE ISOLADO DE INTERFACE" }), _jsx("h1", { style: { fontSize: 32, margin: '16px 0' }, children: "Publica\u00E7\u00E3o de conte\u00FAdo" }), _jsx("p", { children: "Esta tela verifica o componente de confirma\u00E7\u00E3o sem publicar dados." }), _jsx("button", { className: "admin-primary", style: { marginTop: 24 }, onClick: async () => setResult(await confirm('Publicar as alterações de “Vestibular UCP”?') ? 'Confirmação recebida. Nenhum conteúdo real foi alterado.' : 'Ação cancelada.'), children: "Publicar altera\u00E7\u00F5es" }), _jsx("p", { role: "status", style: { marginTop: 20 }, children: result })] }); }
createRoot(document.getElementById('root')).render(_jsx(ConfirmationProvider, { children: _jsx(Demo, {}) }));
