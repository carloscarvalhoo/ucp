'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { PublicationEditor } from './publication-editor';
import { useState } from 'react';
import { api, upload } from './model';
import { Select } from './select';
export function CreateForm({ area, parents = [], onCreated, onDirty, }) {
    const [blocks, setBlocks] = useState([]);
    const [type, setType] = useState('noticias'), [mode, setMode] = useState('Presencial'), [image, setImage] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [parent, setParent] = useState(parents[0]?.value || '/institucional');
    const coverFields = (_jsxs(_Fragment, { children: [_jsxs("label", { children: ["Imagem", _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onChange: async (e) => {
                            const file = e.target.files?.[0];
                            if (!file)
                                return;
                            setBusy(true);
                            try {
                                setImage((await upload(file)).url);
                            }
                            catch (error) {
                                setMessage(error.message);
                            }
                            finally {
                                setBusy(false);
                            }
                        } }), _jsx("small", { children: "JPG, PNG ou WebP, at\u00E9 10 MB." })] }), image && _jsx("img", { src: image, alt: "Imagem selecionada", className: "admin-image-preview" }), _jsxs("label", { children: ["Link da imagem", _jsx("input", { inputMode: "url", placeholder: "https://exemplo.com/imagem.jpg", value: image, onChange: (e) => setImage(e.target.value), required: area === 'home' })] })] }));
    return (_jsxs("form", { className: "admin-form", onChange: onDirty, onSubmit: async (e) => {
            e.preventDefault();
            if (area === 'publications' && !blocks.length) {
                setMessage('Adicione pelo menos um bloco ao conteúdo.');
                return;
            }
            const data = Object.fromEntries(new FormData(e.currentTarget));
            setBusy(true);
            try {
                const result = await api(area === 'publications'
                    ? 'publications'
                    : ['home', 'courses'].includes(area)
                        ? 'catalog'
                        : 'pages', 'POST', {
                    ...data,
                    type: area === 'home'
                        ? 'banner'
                        : area === 'courses'
                            ? 'course'
                            : area === 'publications'
                                ? type
                                : 'page',
                    parent,
                    mode,
                    image,
                    ...(area === 'publications'
                        ? {
                            publicationBlocks: blocks,
                            publicationDate: data.publicationDate
                                ? new Date(String(data.publicationDate)).toISOString()
                                : '',
                        }
                        : {}),
                });
                onCreated(result.id);
            }
            catch (error) {
                setMessage(error.message);
            }
            finally {
                setBusy(false);
            }
        }, children: [!['home', 'courses', 'publications'].includes(area) && (_jsx(Select, { label: "Dentro de qual p\u00E1gina?", value: parent, onChange: (value) => {
                    setParent(value);
                    onDirty();
                }, options: parents.length ? parents : [{ value: '/institucional', label: 'Institucional' }] })), area === 'publications' ? (_jsxs("div", { className: "publication-meta-grid", children: [_jsxs("label", { className: "publication-meta-title", children: ["T\u00EDtulo", _jsx("input", { name: "title", required: true, maxLength: 255 })] }), _jsx(Select, { label: "Tipo de publica\u00E7\u00E3o", value: type, onChange: (value) => {
                            setType(value);
                            onDirty();
                        }, options: [
                            { value: 'noticias', label: 'Notícia' },
                            { value: 'blog', label: 'Blog' },
                            { value: 'eventos', label: 'Evento' },
                        ] }), _jsxs("label", { children: ["Data da publica\u00E7\u00E3o", _jsx("input", { name: "publicationDate", type: "datetime-local" })] }), _jsxs("label", { className: "publication-meta-title", children: ["Endere\u00E7o da publica\u00E7\u00E3o", _jsx("input", { name: "slug", placeholder: "Gerado a partir do t\u00EDtulo", maxLength: 100 })] })] })) : (_jsxs("label", { children: ["T\u00EDtulo", _jsx("input", { name: "title", required: true, maxLength: 255 })] })), area === 'courses' && (_jsxs(_Fragment, { children: [_jsx(Select, { label: "Modalidade", value: mode, onChange: (value) => {
                            setMode(value);
                            onDirty();
                        }, options: [
                            { value: 'Presencial', label: 'Presencial' },
                            { value: 'Smart', label: 'Smart' },
                        ] }), _jsxs("label", { children: ["Dura\u00E7\u00E3o", _jsx("input", { name: "duration", placeholder: "Ex.: 4 anos", required: true })] }), _jsxs("label", { children: ["Diploma", _jsx("input", { name: "diploma", placeholder: "Ex.: Bacharelado", required: true })] }), _jsxs("label", { children: ["Per\u00EDodo", _jsx("input", { name: "period", placeholder: "Ex.: Noturno" })] })] })), area !== 'home' && area !== 'publications' && (_jsxs("label", { children: ["Texto de apresenta\u00E7\u00E3o", _jsx("textarea", { name: "body", required: area !== 'publications' || !blocks.length, rows: 5 })] })), area === 'publications' ? (_jsxs("details", { className: "publication-cover-settings", children: [_jsx("summary", { children: "Imagem de capa" }), coverFields] })) : (coverFields), area === 'publications' && (_jsx(PublicationEditor, { blocks: blocks, onChange: (b) => {
                    setBlocks(b);
                    onDirty();
                } })), area === 'home' && (_jsxs("label", { children: ["Ao clicar no banner, abrir", _jsx("input", { name: "link", placeholder: "Ex.: /vestibular", required: true })] })), _jsxs("div", { className: area === 'publications' ? 'publication-create-actions' : undefined, children: [_jsx("p", { role: "status", children: message }), _jsx("p", { className: "admin-muted", children: "O novo conte\u00FAdo ser\u00E1 criado como rascunho. Voc\u00EA poder\u00E1 revisar antes de publicar." }), _jsx("button", { disabled: busy, className: "admin-primary", children: busy ? 'Preparando…' : 'Criar rascunho' })] })] }));
}
