'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { PublicationEditor } from './publication-editor';
import { useConfirmation } from './confirmation';
import { RichTextEditor } from './rich-text-editor';
import { CollectionEditor } from './collection-editor';
import { useEffect, useRef, useState } from 'react';
import { Modal } from './modal';
import { Select } from './select';
import { AccountForm } from './account-form';
import { CreateForm } from './create-form';
import { api, areas, areaFor, normalize, publicPath, stateLabels, upload, } from './model';
function Menu({ label, children, className = '', }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const close = (e) => {
            if (!ref.current?.contains(e.target))
                setOpen(false);
        };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, []);
    return (_jsxs("div", { className: 'admin-menu ' + className, ref: ref, onKeyDown: (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                ref.current?.querySelector('button')?.focus();
            }
        }, children: [_jsx("button", { type: "button", "aria-label": typeof label === 'string' ? label : undefined, "aria-haspopup": "true", "aria-expanded": open, className: "admin-menu-trigger", onClick: () => setOpen(!open), children: label }), _jsx("div", { hidden: !open, className: "admin-menu-panel", onClick: () => setOpen(false), children: children })] }));
}
function imagePreviewURL(value, route) {
    try {
        const url = new URL(value, location.origin + route);
        return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
    }
    catch {
        return undefined;
    }
}
function AccountIcon({ type }) {
    return (_jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: type === 'trash' ? (_jsx(_Fragment, { children: _jsx("path", { d: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" }) })) : (_jsxs(_Fragment, { children: [_jsx("circle", { cx: "12", cy: "12", r: "3" }), _jsx("path", { d: "m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3Z" })] })) }));
}
export function AdminApp() {
    const confirm = useConfirmation();
    const [user, setUser] = useState(null), [loading, setLoading] = useState(true), [setup, setSetup] = useState(false), [passwordVisible, setPasswordVisible] = useState(false), [entries, setEntries] = useState([]), [area, setArea] = useState('home'), [search, setSearch] = useState(''), [status, setStatus] = useState('all'), [kind, setKind] = useState('all'), [filters, setFilters] = useState(false), [section, setSection] = useState(null), [part, setPart] = useState(''), [dirty, setDirty] = useState(false), [history, setHistory] = useState([]), [modal, setModal] = useState(null), [modalDirty, setModalDirty] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [undoTrash, setUndoTrash] = useState(null), [mobile, setMobile] = useState(false);
    async function refresh() {
        setEntries(await api('sections'));
    }
    useEffect(() => {
        api('status')
            .then(async (s) => {
            setSetup(s.setup);
            setUser(s.user);
            if (s.user)
                await refresh();
        })
            .catch((e) => setMessage(e.message))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        const guard = (e) => {
            if (dirty || modalDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [dirty, modalDirty]);
    async function leave() {
        return (!dirty && !modalDirty) || (await confirm('Descartar as alterações não salvas?'));
    }
    async function go(key) {
        if (!(await leave()))
            return;
        setArea(key);
        setModal(null);
        setModalDirty(false);
        setSection(null);
        setDirty(false);
        setHistory([]);
        setSearch('');
        setStatus('all');
        setKind('all');
        setMobile(false);
        setMessage('');
    }
    async function closeModal() {
        if (modalDirty && !(await confirm('Descartar as alterações deste formulário?')))
            return;
        setModal(null);
        setModalDirty(false);
    }
    async function logout() {
        if (!(await leave()))
            return;
        try {
            await api('logout', 'POST');
            setUser(null);
            setDirty(false);
            setModal(null);
        }
        catch (e) {
            setMessage(e.message);
        }
    }
    async function open(id, skipLeave = false) {
        if (!skipLeave && !(await leave()))
            return;
        setBusy(true);
        try {
            const loaded = await api('sections/' + id);
            setSection(loaded);
            setHistory([]);
            setDirty(false);
            setPart('');
            setMessage('');
        }
        catch (e) {
            setMessage(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    function edit(change) {
        if (!section)
            return;
        setHistory((h) => [...h.slice(-49), structuredClone(section)]);
        const draft = structuredClone(section);
        change(draft);
        setSection(draft);
        setDirty(true);
    }
    async function save() {
        if (!section)
            return;
        const result = await api('sections/' + section.id, 'PUT', {
            revision: section.revision,
            values: section.fields.map((f) => f.value),
            documents: section.documents,
            ...(section.kind === 'publication'
                ? {
                    publicationBlocks: section.publicationBlocks || [],
                    publicationDate: section.publicationDate || '',
                }
                : {}),
            ...(section.collectionChanged ? { collection: section.collection } : {}),
            ...(section.blocksChanged ? { textBlocks: section.blocksChanged } : {}),
        });
        setSection(await api('sections/' + section.id));
        setDirty(false);
        setHistory([]);
        await refresh();
        setMessage('Rascunho salvo. O site ainda não foi alterado.');
    }
    async function perform(operation) {
        setBusy(true);
        try {
            await operation();
        }
        catch (e) {
            setMessage(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    async function change(entry, operation) {
        if (operation === 'trash' &&
            !(await confirm('Excluir “' + entry.title + '”? O conteúdo ficará na lixeira por 30 dias.')))
            return;
        await perform(async () => {
            await api('sections/' + entry.id + '/' + operation, 'POST');
            await refresh();
            if (operation === 'trash') {
                setUndoTrash(entry.id);
                setMessage('Conteúdo movido para a lixeira. Você pode desfazer.');
            }
            else
                setMessage(operation === 'restore'
                    ? 'Conteúdo restaurado como rascunho.'
                    : operation === 'activate'
                        ? 'Conteúdo ativado no site.'
                        : 'Conteúdo ocultado do site.');
        });
    }
    if (loading)
        return (_jsx("main", { className: "admin-shell grid min-h-dvh place-items-center", children: _jsx("p", { role: "status", children: "Carregando seu painel\u2026" }) }));
    if (!user)
        return (_jsxs("main", { className: "admin-shell admin-login", children: [_jsxs("section", { className: "admin-login-form", children: [_jsx("a", { href: "/", className: "text-sm font-medium text-gray-600", children: "\u2190 Voltar ao site" }), _jsxs("div", { children: [_jsx("p", { className: "admin-eyebrow", children: "ADMINISTRA\u00C7\u00C3O DO SITE" }), _jsx("h1", { children: setup ? 'Seu primeiro acesso.' : 'Bem-vindo de volta.' }), _jsx("p", { className: "admin-muted", children: setup
                                        ? 'Crie o acesso responsável pelos conteúdos da UCP.'
                                        : 'Entre para cuidar dos conteúdos da UCP.' }), _jsxs("form", { className: "admin-form mt-8", onSubmit: async (e) => {
                                        e.preventDefault();
                                        const data = Object.fromEntries(new FormData(e.currentTarget));
                                        await perform(async () => {
                                            await api(setup ? 'setup' : 'login', 'POST', data);
                                            const s = await api('status');
                                            setUser(s.user);
                                            await refresh();
                                            setMessage('');
                                        });
                                    }, children: [setup && (_jsxs("label", { children: ["Nome", _jsx("input", { name: "name", required: true, autoComplete: "name", maxLength: 150 })] })), _jsxs("label", { children: ["E-mail", _jsx("input", { name: "email", type: "email", autoComplete: "username", required: true })] }), _jsxs("label", { children: ["Senha", _jsxs("div", { className: "relative", children: [_jsx("input", { name: "password", type: passwordVisible ? 'text' : 'password', style: { paddingRight: 48 }, id: "login-password", autoComplete: setup ? 'new-password' : 'current-password', required: true, minLength: setup ? 12 : undefined }), _jsx("button", { type: "button", className: "absolute right-1 top-1 grid h-9 w-10 place-items-center rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-800", "aria-label": passwordVisible ? 'Ocultar senha' : 'Mostrar senha', "aria-pressed": passwordVisible, "aria-controls": "login-password", onClick: () => setPasswordVisible(!passwordVisible), children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: passwordVisible ? (_jsxs(_Fragment, { children: [_jsx("path", { d: "m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" }), _jsx("path", { d: "M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.9M6.2 6.2A18 18 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.8-1.8" })] })) : (_jsxs(_Fragment, { children: [_jsx("path", { d: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })) }) })] })] }), setup && _jsx("small", { children: "Use pelo menos 12 caracteres." }), _jsx("p", { role: "alert", className: "text-red-700", children: message }), _jsx("button", { className: "admin-primary w-full", disabled: busy, children: busy ? 'Entrando…' : setup ? 'Criar acesso' : 'Entrar no painel' })] }), _jsx("p", { className: "mt-6 text-xs text-gray-500", children: "Acesso exclusivo para a equipe autorizada." })] }), _jsx("span", { className: "text-xs text-gray-500", children: "Faculdade do Centro do Paran\u00E1" })] }), _jsxs("aside", { className: "admin-login-aside", children: [_jsx("span", { className: "admin-login-mark", children: "UCP / CONTE\u00DADO" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-white/70", children: "SIMPLES DE ENCONTRAR. F\u00C1CIL DE ATUALIZAR." }), _jsxs("h2", { children: ["Um espa\u00E7o para", _jsx("br", {}), "manter a UCP", _jsx("br", {}), _jsx("span", { children: "sempre presente." })] }), _jsx("p", { className: "mt-6 max-w-sm text-white/80", children: "Organize p\u00E1ginas, publique novidades e cuide de cada informa\u00E7\u00E3o do site." })] }), _jsx("p", { className: "text-sm text-white/65", children: "Seu trabalho faz a informa\u00E7\u00E3o chegar mais longe." })] })] }));
    const isTrash = area === 'trash';
    const creatingPublication = modal === 'create' && area === 'publications';
    const title = isTrash ? 'Lixeira' : area === 'settings' ? 'Configurações da conta' : areas[area];
    const base = entries.filter((e) => !e.purged && (isTrash ? Boolean(e.trashedAt) : !e.trashedAt && areaFor(e) === area));
    const matches = base.filter((e) => (status === 'all' || e.status === status) &&
        (kind === 'all' || e.kind === kind) &&
        normalize(e.title + ' ' + publicPath(e.route)).includes(normalize(search)));
    const directory = !['home', 'shared', 'courses', 'publications', 'trash'].includes(area);
    const visible = [...matches].sort((a, b) => {
        const depth = (e) => publicPath(e.route).split('/').filter(Boolean).length;
        return directory ? depth(a) - depth(b) || a.title.localeCompare(b.title, 'pt-BR') : 0;
    });
    const editorGroups = Array.from(new Set([...(section?.fieldGroups || []), ...(section?.textBlocks || []).map((b) => b.group)])).filter(Boolean);
    function pageLocation(entry) {
        if (entry.route === '/index.html')
            return 'Página inicial';
        const parts = publicPath(entry.route).split('/').filter(Boolean);
        if (parts.length === 1)
            return 'Página principal';
        const parent = entries.find((e) => publicPath(e.route) === '/' + parts.slice(0, -1).join('/'));
        return parent?.title || areas[area] || 'Página';
    }
    const kindNames = {
        section: 'Página ou seção',
        course: 'Curso',
        banner: 'Banner',
        publication: 'Publicação',
        runtime: 'Lista de conteúdo',
        shared: 'Conteúdo compartilhado',
    };
    return (_jsxs("div", { className: "admin-shell admin-layout", children: [_jsxs("aside", { className: 'admin-sidebar ' + (mobile ? 'is-open' : ''), children: [_jsx("div", { className: "admin-sidebar-heading", children: _jsx("strong", { children: "Administra\u00E7\u00E3o" }) }), _jsx("nav", { "aria-label": "\u00C1reas do site", children: Object.entries(areas).map(([key, label]) => (_jsx("button", { className: area === key ? 'active' : '', onClick: () => go(key), children: label }, key))) }), _jsx("a", { href: "/", target: "_blank", rel: "noopener", className: "admin-site-link", children: "Ver site \u2197" })] }), mobile && (_jsx("button", { className: "admin-mobile-shade", "aria-label": "Fechar navega\u00E7\u00E3o", onClick: () => setMobile(false) })), _jsxs("div", { className: "admin-main", children: [_jsxs("div", { className: "admin-topbar", children: [_jsx("button", { className: "admin-mobile-toggle admin-button", onClick: () => setMobile(!mobile), "aria-expanded": mobile, children: "\u2630 Menu" }), _jsxs(Menu, { className: "admin-account-menu", label: _jsxs("span", { className: "admin-account-button", children: [_jsx("span", { children: user.name }), _jsx("span", { className: "admin-avatar", children: user.name.trim().charAt(0).toUpperCase() }), _jsx("span", { "aria-hidden": true, children: "\u2304" })] }), children: [_jsxs("div", { className: "admin-account-summary", children: [_jsx("small", { children: "Sua conta" }), _jsx("strong", { children: user.name }), _jsx("span", { children: user.email })] }), _jsxs("button", { onClick: () => {
                                            go('settings');
                                        }, children: [_jsx(AccountIcon, { type: "settings" }), _jsx("span", { children: "Configura\u00E7\u00F5es da conta" })] }), _jsxs("button", { onClick: () => go('trash'), children: [_jsx(AccountIcon, { type: "trash" }), _jsx("span", { children: "Lixeira" })] }), _jsx("button", { className: "text-red-700", onClick: () => void logout(), children: "Sair da conta" })] })] }), _jsxs("main", { className: "admin-content", children: [_jsxs("header", { className: "admin-page-header", children: [_jsx("div", { children: _jsx("h1", { children: creatingPublication ? 'Nova publicação' : section ? section.title : title }) }), creatingPublication && (_jsx("button", { className: "admin-button", onClick: () => void closeModal(), children: "\u2190 Voltar \u00E0s publica\u00E7\u00F5es" })), !creatingPublication &&
                                        !section &&
                                        !['trash', 'shared', 'settings'].includes(area) && (_jsxs("button", { className: "admin-primary", onClick: () => {
                                            setModalDirty(false);
                                            setModal('create');
                                        }, children: ["\uFF0B", ' ', area === 'home'
                                                ? 'Novo banner'
                                                : area === 'courses'
                                                    ? 'Novo curso'
                                                    : area === 'publications'
                                                        ? 'Nova publicação'
                                                        : 'Nova página'] }))] }), message && (_jsxs("div", { className: "admin-message", role: "status", children: [_jsx("span", { children: message }), undoTrash && (_jsx("button", { onClick: () => void perform(async () => {
                                            await api('sections/' + undoTrash + '/restore', 'POST');
                                            await refresh();
                                            setUndoTrash(null);
                                            setMessage('Conteúdo restaurado como rascunho.');
                                        }), children: "Desfazer exclus\u00E3o" })), _jsx("button", { "aria-label": "Dispensar aviso", onClick: () => {
                                            setMessage('');
                                            setUndoTrash(null);
                                        }, children: "\u2715" })] })), creatingPublication ? (_jsx("section", { className: "admin-publication-create", "aria-label": "Criar publica\u00E7\u00E3o", children: _jsx(CreateForm, { area: "publications", onDirty: () => setModalDirty(true), onCreated: (id) => {
                                        setModal(null);
                                        setModalDirty(false);
                                        void refresh();
                                        void open(id, true);
                                    } }) })) : area === 'settings' ? (_jsx("div", { className: "admin-editor-body", style: { maxWidth: 760 }, children: _jsx(AccountForm, { user: user, onDirty: () => setModalDirty(true), onSaved: (name) => {
                                        setUser({ ...user, name });
                                        setModalDirty(false);
                                    } }) })) : !section ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "admin-toolbar", children: [_jsxs("label", { className: "admin-search", children: [_jsx("span", { "aria-hidden": true, children: "\u2315" }), _jsx("input", { "aria-label": "Pesquisar conte\u00FAdos", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Pesquisar pelo nome da p\u00E1gina ou conte\u00FAdo\u2026" }), search && (_jsx("button", { "aria-label": "Limpar pesquisa", onClick: () => setSearch(''), children: "\u2715" }))] }), _jsxs("button", { className: 'admin-button ' + (filters ? 'selected' : ''), "aria-expanded": filters, "aria-controls": "admin-filters", onClick: () => setFilters(!filters), children: ["Filtros", status !== 'all' || kind !== 'all' ? ' •' : '', " ", _jsx("span", { "aria-hidden": true, children: "\u2304" })] })] }), filters && (_jsxs("div", { id: "admin-filters", className: "admin-filters", children: [_jsx(Select, { label: "Situa\u00E7\u00E3o do conte\u00FAdo", value: status, onChange: setStatus, options: [
                                                    { value: 'all', label: 'Todas as situações' },
                                                    { value: 'published', label: 'Publicado' },
                                                    { value: 'draft', label: 'Rascunho' },
                                                    { value: 'archived', label: 'Oculto' },
                                                ] }), _jsx(Select, { label: "Tipo de conte\u00FAdo", value: kind, onChange: setKind, options: [
                                                    { value: 'all', label: 'Todos os tipos' },
                                                    ...Array.from(new Set(base.map((e) => e.kind))).map((value) => ({
                                                        value,
                                                        label: kindNames[value] || value,
                                                    })),
                                                ] }), _jsx("button", { className: "admin-button", onClick: () => {
                                                    setStatus('all');
                                                    setKind('all');
                                                }, children: "Limpar filtros" })] })), _jsxs("div", { className: "admin-list-caption", children: [_jsxs("p", { children: [matches.length, ' ', directory
                                                        ? matches.length === 1
                                                            ? 'página encontrada'
                                                            : 'páginas encontradas'
                                                        : matches.length === 1
                                                            ? 'conteúdo encontrado'
                                                            : 'conteúdos encontrados'] }), _jsxs("div", { className: "admin-legend", children: [_jsx("span", { className: "status-dot published" }), "Publicado ", _jsx("span", { className: "status-dot draft" }), "Rascunho ", _jsx("span", { className: "status-dot archived" }), "Oculto"] })] }), _jsx("div", { className: 'admin-card-grid' + (directory ? ' admin-page-list' : ''), children: visible.map((e) => (_jsxs("article", { className: "admin-content-card", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("span", { className: 'admin-badge ' + (e.trashedAt ? 'trash' : e.status), children: [_jsx("span", { className: "status-dot" }), e.trashedAt ? 'Na lixeira' : stateLabels[e.status]] }), _jsxs(Menu, { label: "Mais op\u00E7\u00F5es", children: [_jsx("button", { onClick: () => void open(e.id), disabled: Boolean(e.trashedAt), children: "Editar conte\u00FAdo" }), !['shared', 'runtime'].includes(e.kind) && !e.trashedAt && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => void change(e, e.status === 'archived' ? 'activate' : 'hide'), disabled: e.status === 'draft', children: e.status === 'archived' ? 'Ativar' : 'Ocultar' }), _jsx("button", { className: "text-red-700", onClick: () => void change(e, 'trash'), children: "Excluir" })] })), e.trashedAt && (_jsx("button", { onClick: () => void change(e, 'restore'), children: "Restaurar como rascunho" }))] })] }), _jsx("button", { disabled: Boolean(e.trashedAt), onClick: () => void open(e.id), className: "admin-card-title", children: e.title }), _jsx("p", { className: "admin-muted text-sm", children: directory
                                                        ? pageLocation(e)
                                                        : e.route === '/index.html'
                                                            ? 'Página inicial · ' + (kindNames[e.kind] || 'Seção')
                                                            : e.title }), _jsx("footer", { children: e.trashedAt ? (_jsxs("span", { className: "text-sm text-red-700", children: ["Dispon\u00EDvel at\u00E9", ' ', new Date(Date.parse(e.trashedAt) + 30 * 86400000).toLocaleDateString('pt-BR')] })) : (_jsx("button", { className: "admin-edit-link", onClick: () => void open(e.id), children: "Editar conte\u00FAdo" })) })] }, e.id))) }), !visible.length && (_jsxs("div", { className: "admin-empty", children: [_jsx("h2", { children: isTrash ? 'A lixeira está vazia.' : 'Nenhum conteúdo encontrado.' }), _jsx("p", { children: "Tente outro termo ou limpe os filtros." }), _jsx("button", { className: "admin-button", onClick: () => {
                                                    setSearch('');
                                                    setStatus('all');
                                                    setKind('all');
                                                }, children: "Limpar pesquisa e filtros" })] }))] })) : (_jsxs("section", { children: [_jsxs("button", { className: "admin-edit-link mb-5", onClick: async () => {
                                            if (await leave()) {
                                                setSection(null);
                                                setDirty(false);
                                            }
                                        }, children: ["\u2190 Voltar para ", title] }), _jsxs("div", { className: "admin-editor-toolbar", children: [_jsxs("span", { className: "admin-muted", children: [dirty ? '● Alterações não salvas' : 'Conteúdo carregado', " \u00B7", ' ', publicPath(section.route)] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { className: "admin-button", disabled: !history.length || busy, onClick: () => {
                                                            const previous = history.at(-1);
                                                            if (previous) {
                                                                setSection(previous);
                                                                setHistory(history.slice(0, -1));
                                                                setDirty(true);
                                                            }
                                                        }, children: "\u21B6 Desfazer" }), _jsx("button", { className: "admin-button", disabled: busy, onClick: () => void perform(save), children: "Salvar rascunho" }), _jsx("button", { className: "admin-button", disabled: busy, onClick: () => void perform(async () => {
                                                            if (dirty)
                                                                await save();
                                                            setModal('preview');
                                                        }), children: "Conferir pr\u00E9via" }), _jsx("button", { className: "admin-primary", disabled: busy, onClick: () => void perform(async () => {
                                                            if (!(await confirm('Publicar as alterações de “' + section.title + '”?')))
                                                                return;
                                                            if (dirty)
                                                                await save();
                                                            await api('sections/' + section.id + '/publish', 'POST');
                                                            setSection(await api('sections/' + section.id));
                                                            await refresh();
                                                            setMessage('Alterações publicadas no site.');
                                                        }), children: "Publicar altera\u00E7\u00F5es" })] })] }), _jsxs("div", { className: "admin-editor-body", children: [section.kind === 'publication' && (_jsxs(_Fragment, { children: [_jsxs("label", { children: ["Data da publica\u00E7\u00E3o", _jsx("input", { type: "datetime-local", value: section.publicationDate
                                                                    ? new Date(new Date(section.publicationDate).getTime() -
                                                                        new Date(section.publicationDate).getTimezoneOffset() * 60000)
                                                                        .toISOString()
                                                                        .slice(0, 16)
                                                                    : '', onChange: (e) => edit((d) => {
                                                                    d.publicationDate = e.target.value
                                                                        ? new Date(e.target.value).toISOString()
                                                                        : '';
                                                                }) })] }), _jsx(PublicationEditor, { blocks: section.publicationBlocks || [], onChange: (blocks) => edit((d) => {
                                                            d.publicationBlocks = blocks;
                                                        }) })] })), editorGroups.length > 1 && (_jsx(Select, { label: "Conte\u00FAdo da p\u00E1gina", value: part, onChange: setPart, options: [
                                                    { value: '', label: 'Mostrar tudo' },
                                                    ...editorGroups.map((value) => ({ value, label: value })),
                                                ] })), section.collection && (_jsx(CollectionEditor, { value: section.collection, onChange: (collection) => edit((d) => {
                                                    d.collection = collection;
                                                    d.collectionChanged = true;
                                                }) })), section.textBlocks
                                                ?.filter((block) => !part || block.group === part)
                                                .map((block) => (_jsxs("section", { className: "admin-text-block", children: [_jsx("h3", { children: block.label }), block.kind === 'heading' ? (_jsx("input", { className: "admin-input", "aria-label": block.label, maxLength: 400, value: block.value, onChange: (e) => edit((d) => {
                                                            d.textBlocks.find((b) => b.id === block.id).value = e.target.value;
                                                            d.blocksChanged = {
                                                                ...d.blocksChanged,
                                                                [block.id]: e.target.value,
                                                            };
                                                        }) })) : (_jsx(RichTextEditor, { label: block.label, value: block.value, onChange: (value) => edit((d) => {
                                                            d.textBlocks.find((b) => b.id === block.id).value = value;
                                                            d.blocksChanged = { ...d.blocksChanged, [block.id]: value };
                                                        }) }))] }, section.id + '-' + block.id))), _jsxs("div", { className: "admin-form", children: [section.fields.map((field, index) => {
                                                        if (section.collection?.fieldIndices.includes(index) ||
                                                            section.textBlocks?.some((block) => block.fieldIndices.includes(index)))
                                                            return null;
                                                        if (part && section.fieldGroups?.[index] !== part)
                                                            return null;
                                                        return (_jsxs("label", { children: [field.label || 'Conteúdo', field.kind === 'image' && (_jsxs(_Fragment, { children: [_jsx("img", { src: imagePreviewURL(field.value, section.route), alt: field.label, className: "admin-image-preview" }), _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp", onChange: (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file)
                                                                                    void perform(async () => {
                                                                                        const result = await upload(file);
                                                                                        edit((d) => {
                                                                                            d.fields[index].value = result.url;
                                                                                        });
                                                                                    });
                                                                            } })] })), field.kind === 'text' && field.value.length > 100 ? (_jsx("textarea", { rows: 5, value: field.value, onChange: (e) => edit((d) => {
                                                                        d.fields[index].value = e.target.value;
                                                                    }) })) : (_jsx("input", { inputMode: field.kind === 'image' ? 'url' : undefined, placeholder: field.kind === 'image'
                                                                        ? 'Cole o link da imagem: https://…'
                                                                        : undefined, "aria-label": field.kind === 'image' ? 'Link da imagem — ' + field.label : undefined, value: field.value, onChange: (e) => edit((d) => {
                                                                        d.fields[index].value = e.target.value;
                                                                    }) }))] }, index));
                                                    }), _jsxs("details", { className: "admin-documents-panel", open: section.documents.length > 0, children: [_jsx("summary", { children: "Documentos e PDFs" }), section.documents.map((doc, index) => (_jsxs("div", { className: "admin-document", children: [_jsxs("label", { children: ["T\u00EDtulo", _jsx("input", { value: doc.title, onChange: (e) => edit((d) => {
                                                                                    d.documents[index].title = e.target.value;
                                                                                }) })] }), _jsxs("label", { children: ["Arquivo ou link", _jsx("input", { value: doc.url, onChange: (e) => edit((d) => {
                                                                                    d.documents[index].url = e.target.value;
                                                                                }) }), _jsx("input", { type: "file", accept: "application/pdf", onChange: (e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file)
                                                                                        void perform(async () => {
                                                                                            const result = await upload(file);
                                                                                            edit((d) => {
                                                                                                d.documents[index].url = result.url;
                                                                                            });
                                                                                        });
                                                                                } })] }), _jsx("button", { className: "admin-button", onClick: () => edit((d) => {
                                                                            d.documents.splice(index, 1);
                                                                        }), children: "Remover documento" })] }, index))), _jsx("button", { className: "admin-button mt-4", onClick: () => edit((d) => {
                                                                    d.documents.push({ title: '', url: '' });
                                                                }), children: "\uFF0B Adicionar documento" })] })] })] })] }))] })] }), modal === 'create' && area !== 'publications' && (_jsx(Modal, { wide: area === 'publications', title: area === 'home'
                    ? 'Novo banner'
                    : area === 'courses'
                        ? 'Novo curso'
                        : area === 'publications'
                            ? 'Nova publicação'
                            : 'Nova página', onClose: closeModal, children: _jsx(CreateForm, { area: area, parents: Array.from(new Map(entries
                        .filter((e) => areaFor(e) === area && !e.trashedAt && e.kind !== 'runtime')
                        .map((e) => [
                        publicPath(e.route),
                        { value: publicPath(e.route), label: e.title + ' · ' + publicPath(e.route) },
                    ])).values()), onDirty: () => setModalDirty(true), onCreated: (id) => {
                        setModal(null);
                        setModalDirty(false);
                        void refresh();
                        void open(id, true);
                    } }) })), modal === 'preview' && section && (_jsx(Modal, { title: "Pr\u00E9via do rascunho \u2014 ainda n\u00E3o publicada", wide: true, onClose: () => setModal(null), children: _jsx("iframe", { className: "admin-preview", title: "Pr\u00E9via do conte\u00FAdo", sandbox: "allow-same-origin", src: '/api/admin/sections/' + section.id + '/preview' }) }))] }));
}
