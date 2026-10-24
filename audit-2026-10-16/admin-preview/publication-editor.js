'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { RichTextEditor } from './rich-text-editor';
import { upload } from './model';
import { useState, useEffect, createElement } from 'react';
export function PublicationEditor({ blocks, onChange: onCommit, }) {
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [past, setPast] = useState([]), [future, setFuture] = useState([]);
    function onChange(next) {
        setPast((h) => [...h.slice(-49), structuredClone(blocks)]);
        setFuture([]);
        onCommit(next);
    }
    function undo() {
        if (!past.length)
            return;
        setFuture((h) => [structuredClone(blocks), ...h]);
        onCommit(past[past.length - 1]);
        setPast((h) => h.slice(0, -1));
    }
    function redo() {
        if (!future.length)
            return;
        setPast((h) => [...h, structuredClone(blocks)]);
        onCommit(future[0]);
        setFuture((h) => h.slice(1));
    }
    const [selected, setSelected] = useState(blocks[0]?.id || '');
    const [device, setDevice] = useState('desktop');
    const active = blocks.some((b) => b.id === selected) ? selected : blocks[0]?.id;
    function add(type, at = blocks.length) {
        const block = { id: crypto.randomUUID(), type, images: type === 'gallery' ? [] : undefined };
        const next = [...blocks];
        next.splice(at, 0, block);
        onChange(next);
        setSelected(block.id);
    }
    function drop(e, at) {
        e.preventDefault();
        try {
            const item = JSON.parse(e.dataTransfer.getData('application/x-ucp-block'));
            if (item.id) {
                const from = blocks.findIndex((b) => b.id === item.id);
                if (from < 0)
                    return;
                const next = [...blocks], [block] = next.splice(from, 1);
                next.splice(from < at ? at - 1 : at, 0, block);
                onChange(next);
                setSelected(block.id);
            }
            else if (['text', 'heading', 'section', 'image', 'gallery', 'button', 'document'].includes(item.type))
                add(item.type, at);
        }
        catch { }
    }
    function update(i, patch) {
        onChange(blocks.map((b, n) => (n === i ? { ...b, ...patch } : b)));
    }
    async function file(i, f) {
        setBusy(true);
        setError('');
        try {
            update(i, { url: (await upload(f)).url });
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    const labels = {
        text: 'Texto',
        heading: 'Título',
        section: 'Seção',
        image: 'Imagem',
        gallery: 'Galeria',
        button: 'Botão com link',
        document: 'Documento ou PDF',
    };
    return (_jsxs("div", { className: "publication-visual-builder", children: [_jsxs("aside", { className: "publication-builder-tools", children: [_jsxs("div", { className: "publication-history", children: [_jsx("button", { type: "button", disabled: !past.length || busy, onClick: undo, children: "\u21B6 Desfazer" }), _jsx("button", { type: "button", disabled: !future.length || busy, onClick: redo, children: "\u21B7 Refazer" })] }), _jsx("h3", { children: "Componentes" }), _jsx("div", { className: "publication-palette", children: Object.entries(labels).map(([type, label]) => (_jsxs("button", { type: "button", disabled: busy || blocks.length >= 100, draggable: true, onDragStart: (e) => e.dataTransfer.setData('application/x-ucp-block', JSON.stringify({ type })), onClick: () => add(type), children: [_jsx("span", { "aria-hidden": "true", children: _jsx(BlockIcon, { type: type }) }), label, _jsx("span", { "aria-hidden": "true", children: "\u283F" })] }, type))) }), _jsxs("div", { className: "publication-block-editor", children: [_jsx("h3", { children: "Editar bloco" }), blocks.map((b, i) => b.id === active && (_jsxs("fieldset", { className: "publication-block", children: [_jsxs("legend", { children: [i + 1, ". ", labels[b.type]] }), _jsxs("div", { className: "admin-actions", children: [_jsx("button", { type: "button", disabled: !i || busy, "aria-label": "Mover bloco para cima", onClick: () => {
                                                    const a = [...blocks];
                                                    [a[i - 1], a[i]] = [a[i], a[i - 1]];
                                                    onChange(a);
                                                }, children: "Subir" }), _jsx("button", { type: "button", disabled: i === blocks.length - 1 || busy, onClick: () => {
                                                    const a = [...blocks];
                                                    [a[i + 1], a[i]] = [a[i], a[i + 1]];
                                                    onChange(a);
                                                }, children: "Descer" }), _jsx("button", { type: "button", onClick: () => {
                                                    const copy = { ...structuredClone(b), id: crypto.randomUUID() };
                                                    const next = [...blocks];
                                                    next.splice(i + 1, 0, copy);
                                                    onChange(next);
                                                    setSelected(copy.id);
                                                }, children: "Duplicar" }), _jsx("button", { type: "button", onClick: () => onChange(blocks.filter((_, n) => n !== i)), children: "Remover bloco" })] }), ['heading', 'section', 'button', 'document'].includes(b.type) && (_jsxs("label", { children: [b.type === 'button' ? 'Texto do botão' : 'Título', _jsx("input", { value: b.title || '', onChange: (e) => update(i, { title: e.target.value }) })] })), b.type === 'section' && (_jsxs("label", { children: ["Subt\u00EDtulo", _jsx("input", { value: b.subtitle || '', onChange: (e) => update(i, { subtitle: e.target.value }) })] })), ['text', 'section'].includes(b.type) && (_jsx(RichTextEditor, { label: "Conte\u00FAdo", value: b.text || '', onChange: (text) => update(i, { text }) })), ['button', 'document', 'image'].includes(b.type) && (_jsxs("label", { children: ["Link", _jsx("input", { value: b.url || '', onChange: (e) => update(i, { url: e.target.value }), placeholder: "https:// ou /documentos/..." })] })), ['document', 'image'].includes(b.type) && (_jsxs("label", { children: ["Enviar arquivo", _jsx("input", { type: "file", disabled: busy, accept: b.type === 'image' ? 'image/jpeg,image/png,image/webp' : '.pdf', onChange: (e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f)
                                                        void file(i, f);
                                                } })] })), b.type === 'image' && (_jsxs("label", { children: ["Descri\u00E7\u00E3o da imagem", _jsx("input", { value: b.caption || '', onChange: (e) => update(i, { caption: e.target.value }) })] })), b.type === 'gallery' && (_jsxs(_Fragment, { children: [_jsxs("label", { children: ["Adicionar fotos", _jsx("input", { type: "file", multiple: true, accept: "image/jpeg,image/png,image/webp", disabled: busy, onChange: async (e) => {
                                                            const files = Array.from(e.target.files || []);
                                                            setBusy(true);
                                                            setError('');
                                                            try {
                                                                const images = [...(b.images || [])];
                                                                for (const f of files)
                                                                    images.push({ url: (await upload(f)).url, caption: '' });
                                                                update(i, { images });
                                                            }
                                                            catch (e) {
                                                                setError(e.message);
                                                            }
                                                            finally {
                                                                setBusy(false);
                                                            }
                                                        } })] }), (b.images || []).map((im, n) => (_jsxs("div", { children: [_jsxs("label", { children: ["Link da imagem", _jsx("input", { value: im.url, onChange: (e) => update(i, {
                                                                    images: b.images.map((v, k) => k === n ? { ...v, url: e.target.value } : v),
                                                                }) })] }), _jsxs("label", { children: ["Descri\u00E7\u00E3o", _jsx("input", { value: im.caption, onChange: (e) => update(i, {
                                                                    images: b.images.map((v, k) => k === n ? { ...v, caption: e.target.value } : v),
                                                                }) })] }), _jsx("button", { type: "button", onClick: () => update(i, { images: b.images.filter((_, k) => k !== n) }), children: "Remover foto" })] }, n))), _jsx("button", { type: "button", onClick: () => update(i, { images: [...(b.images || []), { url: '', caption: '' }] }), children: "Adicionar imagem por link" })] }))] }, b.id))), _jsx("p", { role: "status", children: busy ? 'Enviando arquivo…' : error })] })] }), _jsxs("section", { className: "publication-builder-preview", children: [_jsxs("div", { className: "publication-preview-toolbar", children: [_jsx("strong", { children: "Pr\u00E9via da publica\u00E7\u00E3o" }), _jsxs("div", { children: [_jsx("button", { type: "button", "aria-pressed": device === 'desktop', onClick: () => setDevice('desktop'), children: "Computador" }), _jsx("button", { type: "button", "aria-pressed": device === 'mobile', onClick: () => setDevice('mobile'), children: "Celular" })] })] }), _jsxs("div", { className: 'publication-preview-canvas ' + device, onDragOver: (e) => e.preventDefault(), onDrop: (e) => {
                            if (e.target === e.currentTarget)
                                drop(e, blocks.length);
                        }, children: [!blocks.length && (_jsx("div", { className: "publication-empty-canvas", onDragOver: (e) => e.preventDefault(), onDrop: (e) => {
                                    e.stopPropagation();
                                    drop(e, 0);
                                }, children: "Adicione ou arraste um componente para come\u00E7ar." })), blocks.map((b, i) => (_jsxs("div", { className: 'publication-preview-block ' + (active === b.id ? 'selected' : ''), role: "button", tabIndex: 0, "aria-label": 'Editar ' + labels[b.type] + ' ' + (i + 1), draggable: true, onDragStart: (e) => e.dataTransfer.setData('application/x-ucp-block', JSON.stringify({ id: b.id })), onDragOver: (e) => e.preventDefault(), onDrop: (e) => {
                                    e.stopPropagation();
                                    drop(e, i);
                                }, onClick: () => setSelected(b.id), onKeyDown: (e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelected(b.id);
                                    }
                                }, children: [_jsxs("span", { className: "publication-block-caption", children: [labels[b.type], " \u00B7 ", i + 1] }), _jsx(BlockPreview, { block: b })] }, b.id)))] })] })] }));
}
function RichPreview({ html }) {
    const [nodes, setNodes] = useState(null);
    useEffect(() => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const allowed = new Set([
            'P',
            'STRONG',
            'B',
            'EM',
            'I',
            'UL',
            'OL',
            'LI',
            'H2',
            'H3',
            'H4',
            'BLOCKQUOTE',
            'BR',
            'TABLE',
            'THEAD',
            'TBODY',
            'TR',
            'TH',
            'TD',
        ]);
        function render(node, key) {
            if (node.nodeType === 3)
                return node.textContent;
            if (node.nodeType !== 1)
                return null;
            const el = node;
            if (['SCRIPT', 'STYLE', 'IFRAME', 'IMG'].includes(el.tagName))
                return null;
            const children = Array.from(el.childNodes).map((n, i) => render(n, i));
            return createElement(allowed.has(el.tagName) ? el.tagName.toLowerCase() : 'span', { key }, ...children);
        }
        setNodes(Array.from(doc.body.childNodes).map((n, i) => render(n, i)));
    }, [html]);
    return _jsx("div", { className: "publication-preview-rich", children: nodes || _jsx("p", { children: "Escreva seu texto\u2026" }) });
}
function BlockPreview({ block: b }) {
    const image = (url, caption) => url && /^(https?:\/\/|\/(?!\/))/.test(url) ? (_jsx("img", { src: url, alt: caption || '' })) : (_jsx("div", { className: "publication-image-placeholder", children: "Imagem" }));
    switch (b.type) {
        case 'heading':
            return _jsx("h2", { children: b.title || 'Título' });
        case 'text':
            return _jsx(RichPreview, { html: b.text || '' });
        case 'section':
            return (_jsxs("section", { children: [_jsx("h2", { children: b.title || 'Título da seção' }), b.subtitle && _jsx("p", { className: "publication-preview-subtitle", children: b.subtitle }), _jsx(RichPreview, { html: b.text || '' })] }));
        case 'image':
            return (_jsxs("figure", { children: [image(b.url, b.caption), b.caption && _jsx("figcaption", { children: b.caption })] }));
        case 'gallery':
            return (_jsx("div", { className: "publication-preview-gallery", children: b.images?.length ? (b.images.map((im, i) => (_jsxs("figure", { children: [image(im.url, im.caption), _jsx("figcaption", { children: im.caption })] }, i)))) : (_jsx("div", { className: "publication-image-placeholder", children: "Galeria de fotos" })) }));
        case 'button':
            return _jsx("span", { className: "publication-preview-cta", children: b.title || 'Texto do botão' });
        case 'document':
            return (_jsxs("div", { className: "publication-preview-document", children: ["\u25A4 ", b.title || 'Documento ou PDF', _jsx("small", { children: "Abrir documento" })] }));
    }
}
function BlockIcon({ type }) {
    const paths = {
        text: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 5h16M4 10h16M4 15h10M4 20h13" }) })),
        heading: (_jsx(_Fragment, { children: _jsx("path", { d: "M4 5v14M14 5v14M4 12h10M18 9h3M19.5 9v10" }) })),
        section: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("path", { d: "M3 9h18M9 9v12" })] })),
        image: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }), _jsx("circle", { cx: "8", cy: "8", r: "1.5" }), _jsx("path", { d: "m3 17 5-5 4 4 3-3 6 6" })] })),
        gallery: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "7", y: "3", width: "14", height: "15", rx: "2" }), _jsx("path", { d: "M3 7v12a2 2 0 0 0 2 2h12M7 14l4-4 3 3 2-2 5 5" }), _jsx("circle", { cx: "12", cy: "7", r: "1" })] })),
        button: (_jsxs(_Fragment, { children: [_jsx("rect", { x: "2", y: "6", width: "20", height: "12", rx: "3" }), _jsx("path", { d: "M6 12h12m-3-3 3 3-3 3" })] })),
        document: (_jsx(_Fragment, { children: _jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5" }) })),
    };
    return (_jsx("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: paths[type] }));
}
