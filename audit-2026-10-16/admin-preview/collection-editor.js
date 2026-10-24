'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useConfirmation } from './confirmation';
import { useState } from 'react';
import { upload } from './model';
export function CollectionEditor({ value, onChange, }) {
    const confirm = useConfirmation();
    const [open, setOpen] = useState(0), [message, setMessage] = useState(''), [uploading, setUploading] = useState(false);
    const menu = ['header', 'footer'].includes(value.type), images = ['gallery', 'community', 'instagram'].includes(value.type);
    function update(index, change) {
        const next = structuredClone(value);
        change(next.items[index]);
        onChange(next);
    }
    function move(index, direction) {
        const target = index + direction;
        if (target < 0 || target >= value.items.length)
            return;
        const next = structuredClone(value);
        [next.items[index], next.items[target]] = [next.items[target], next.items[index]];
        onChange(next);
        setOpen(target);
    }
    return (_jsxs("section", { children: [_jsxs("div", { className: "mb-5 flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold", children: menu
                                    ? 'Itens de navegação'
                                    : value.type === 'instagram'
                                        ? 'Publicações do Instagram'
                                        : value.type === 'gallery'
                                            ? 'Fotos da galeria'
                                            : 'Itens desta seção' }), _jsx("p", { className: "admin-muted text-xs", children: "Adicione, organize e escolha o que aparece no site. Salve e publique ao terminar." })] }), _jsxs("button", { type: "button", className: "admin-button", disabled: value.type === 'instagram' && value.items.length >= 4, onClick: () => {
                            onChange({
                                ...value,
                                items: [
                                    ...value.items,
                                    {
                                        title: images ? 'Nova foto' : menu ? 'Novo grupo' : 'Novo item',
                                        ...(menu ? { children: [] } : {}),
                                    },
                                ],
                            });
                            setOpen(value.items.length);
                        }, children: ["\uFF0B", ' ', value.type === 'instagram'
                                ? 'Adicionar publicação'
                                : images
                                    ? 'Adicionar foto'
                                    : menu
                                        ? 'Adicionar grupo'
                                        : 'Adicionar item'] })] }), message && (_jsx("p", { role: "status", className: "admin-message", children: message })), _jsx("ol", { className: "grid gap-3", children: value.items.map((item, index) => (_jsxs("li", { className: 'admin-collection-item ' + (item.hidden ? 'is-hidden' : ''), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "admin-collection-number", children: String(index + 1).padStart(2, '0') }), item.image && (_jsx("img", { src: item.image, alt: "", className: "h-10 w-14 rounded object-cover" })), _jsxs("button", { className: "min-w-0 flex-1 text-left text-sm font-semibold", type: "button", "aria-expanded": open === index, onClick: () => setOpen(open === index ? null : index), children: [item.title, _jsx("small", { className: "ml-2 font-normal text-gray-500", children: item.hidden ? 'Oculto' : item.automatic ? 'Cursos automáticos' : '' })] }), _jsx("button", { type: "button", className: "admin-icon-button", "aria-label": 'Mover ' + item.title + ' para cima', disabled: index === 0, onClick: () => move(index, -1), children: "\u2191" }), _jsx("button", { type: "button", className: "admin-icon-button", "aria-label": 'Mover ' + item.title + ' para baixo', disabled: index === value.items.length - 1, onClick: () => move(index, 1), children: "\u2193" }), _jsx("button", { type: "button", className: "admin-icon-button", "aria-label": 'Editar ' + item.title, onClick: () => setOpen(open === index ? null : index), children: "\u2304" })] }), open === index && (_jsxs("div", { className: "admin-form mt-5 border-t border-gray-100 pt-5", children: [_jsxs("label", { children: [value.type === 'gallery' ? 'Descrição da foto' : 'Título', _jsx("input", { value: item.title, maxLength: 150, onChange: (e) => update(index, (d) => {
                                                d.title = e.target.value;
                                            }) })] }), !menu && !['gallery', 'instagram'].includes(value.type) && (_jsxs("label", { children: ["Descri\u00E7\u00E3o", _jsx("textarea", { rows: 2, value: item.description || '', maxLength: 2000, onChange: (e) => update(index, (d) => {
                                                d.description = e.target.value;
                                            }) })] })), images && (_jsxs("label", { children: ["Imagem", _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp", disabled: uploading, onChange: async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file)
                                                    return;
                                                setUploading(true);
                                                try {
                                                    const result = await upload(file);
                                                    update(index, (d) => {
                                                        d.image = result.url;
                                                    });
                                                    setMessage('Imagem enviada. Salve o rascunho para mantê-la.');
                                                }
                                                catch (error) {
                                                    setMessage(error.message);
                                                }
                                                finally {
                                                    setUploading(false);
                                                }
                                            } }), _jsx("input", { "aria-label": "Link da imagem", inputMode: "url", placeholder: "Ou cole o link da imagem: https://\u2026", value: item.image || '', onChange: (e) => update(index, (d) => {
                                                d.image = e.target.value;
                                            }) })] })), !images && !menu && (_jsxs("label", { children: ["\u00CDcone", _jsx("input", { value: item.icon || '', placeholder: "Ex.: school, event_note, menu_book", maxLength: 60, onChange: (e) => update(index, (d) => {
                                                d.icon = e.target.value;
                                            }) })] })), value.type !== 'gallery' && !item.children && (_jsxs("label", { children: [value.type === 'instagram'
                                            ? 'Link da publicação no Instagram'
                                            : 'Ao clicar, abrir', _jsx("input", { value: item.link || '', placeholder: value.type === 'instagram'
                                                ? 'https://www.instagram.com/p/…/'
                                                : 'Ex.: /contato', onChange: (e) => update(index, (d) => {
                                                d.link = e.target.value;
                                            }) })] })), menu && !item.automatic && (_jsxs("div", { children: [_jsx("h4", { className: "mb-3 text-sm font-semibold", children: "Links deste grupo" }), item.children?.map((child, j) => (_jsxs("div", { className: "mb-3 grid gap-2 rounded-lg bg-gray-50 p-3", children: [_jsxs("label", { children: ["Nome do link", _jsx("input", { value: child.title, onChange: (e) => update(index, (d) => {
                                                                d.children[j].title = e.target.value;
                                                            }) })] }), _jsxs("label", { children: ["Destino", _jsx("input", { value: child.link || '', onChange: (e) => update(index, (d) => {
                                                                d.children[j].link = e.target.value;
                                                            }) })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", className: "admin-button", disabled: j === 0, onClick: () => update(index, (d) => {
                                                                [d.children[j], d.children[j - 1]] = [
                                                                    d.children[j - 1],
                                                                    d.children[j],
                                                                ];
                                                            }), children: "\u2191 Subir" }), _jsx("button", { type: "button", className: "admin-button", disabled: j === item.children.length - 1, onClick: () => update(index, (d) => {
                                                                [d.children[j], d.children[j + 1]] = [
                                                                    d.children[j + 1],
                                                                    d.children[j],
                                                                ];
                                                            }), children: "\u2193 Descer" }), _jsx("button", { type: "button", className: "admin-button", onClick: () => update(index, (d) => {
                                                                d.children.splice(j, 1);
                                                            }), children: "Remover link" })] })] }, j))), _jsx("button", { type: "button", className: "admin-button", onClick: () => update(index, (d) => {
                                                d.children = [...(d.children || []), { title: 'Novo link', link: '/' }];
                                            }), children: "\uFF0B Adicionar link" })] })), item.automatic && (_jsx("p", { className: "admin-muted text-xs", children: "Os links deste grupo s\u00E3o preenchidos pelos cursos publicados. Cadastre e edite os cursos na \u00E1rea Cursos." })), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("label", { className: "flex! items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: !item.hidden, onChange: (e) => update(index, (d) => {
                                                        d.hidden = !e.target.checked;
                                                    }), style: { width: 16, minHeight: 16 } }), "Mostrar no site"] }), _jsx("button", { type: "button", className: "admin-button text-red-700", onClick: async () => {
                                                if (!(await confirm('Remover este item do rascunho? Você poderá desfazer antes de salvar.')))
                                                    return;
                                                onChange({ ...value, items: value.items.filter((_, i) => i !== index) });
                                                setOpen(null);
                                            }, children: "Remover item" })] })] }))] }, index))) }), !value.items.length && (_jsx("p", { className: "admin-muted py-8 text-center", children: "Nenhum item cadastrado. Use o bot\u00E3o acima para come\u00E7ar." }))] }));
}
