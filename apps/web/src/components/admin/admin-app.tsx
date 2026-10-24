'use client';
import Link from 'next/link';
import { PublicationEditor } from './publication-editor';
import { useConfirmation } from './confirmation';
import { RichTextEditor } from './rich-text-editor';
import { CollectionEditor } from './collection-editor';

import { useEffect, useRef, useState } from 'react';
import { Modal } from './modal';
import { Select } from './select';
import { AccountForm, type User } from './account-form';
import { CreateForm } from './create-form';
import {
  api,
  areas,
  areaFor,
  normalize,
  publicPath,
  stateLabels,
  upload,
  type Entry,
  type Section,
} from './model';
import './admin.css';
function Menu({
  label,
  children,
  className = '',
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <div
      className={'admin-menu ' + className}
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          ref.current?.querySelector('button')?.focus();
        }
      }}
    >
      <button
        type="button"
        aria-label={typeof label === 'string' ? label : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        className="admin-menu-trigger"
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      <div hidden={!open} className="admin-menu-panel" onClick={() => setOpen(false)}>
        {children}
      </div>
    </div>
  );
}
function imagePreviewURL(value: string, route: string) {
  try {
    const url = new URL(value, location.origin + route);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
function AccountIcon({ type }: { type: 'settings' | 'trash' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === 'trash' ? (
        <>
          <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3Z" />
        </>
      )}
    </svg>
  );
}
export function AdminApp() {
  const confirm = useConfirmation();
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [setup, setSetup] = useState(false),
    [passwordVisible, setPasswordVisible] = useState(false),
    [entries, setEntries] = useState<Entry[]>([]),
    [area, setArea] = useState('home'),
    [search, setSearch] = useState(''),
    [status, setStatus] = useState('all'),
    [kind, setKind] = useState('all'),
    [filters, setFilters] = useState(false),
    [view, setView] = useState<'list' | 'grid'>(() => {
      try {
        const saved = localStorage.getItem('ucp-admin-view');
        return saved === 'list' || saved === 'grid' ? saved : 'grid';
      } catch {
        return 'grid';
      }
    }),
    [section, setSection] = useState<Section | null>(null),
    [part, setPart] = useState(''),
    [dirty, setDirty] = useState(false),
    [history, setHistory] = useState<Section[]>([]),
    [modal, setModal] = useState<'create' | 'preview' | null>(null),
    [modalDirty, setModalDirty] = useState(false),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [undoTrash, setUndoTrash] = useState<number | null>(null),
    [mobile, setMobile] = useState(false);
  function changeView(next: 'list' | 'grid') {
    setView(next);
    try {
      localStorage.setItem('ucp-admin-view', next);
    } catch {}
  }
  async function refresh() {
    setEntries(await api('sections'));
  }
  useEffect(() => {
    api('status')
      .then(async (s) => {
        setSetup(s.setup);
        setUser(s.user);
        if (s.user) await refresh();
      })
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
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
  async function go(key: string) {
    if (!(await leave())) return;
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
    if (modalDirty && !(await confirm('Descartar as alterações deste formulário?'))) return;
    setModal(null);
    setModalDirty(false);
  }
  async function logout() {
    if (!(await leave())) return;
    try {
      await api('logout', 'POST');
      setUser(null);
      setDirty(false);
      setModal(null);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  async function open(id: number, skipLeave = false) {
    if (!skipLeave && !(await leave())) return;
    setBusy(true);
    try {
      const loaded = await api('sections/' + id);
      setSection(loaded);
      setHistory([]);
      setDirty(false);
      setPart('');
      setMessage('');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function edit(change: (draft: Section) => void) {
    if (!section) return;
    setHistory((h) => [...h.slice(-49), structuredClone(section)]);
    const draft = structuredClone(section);
    change(draft);
    setSection(draft);
    setDirty(true);
  }
  async function save() {
    if (!section) return;
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
  async function perform(operation: () => Promise<void>) {
    setBusy(true);
    try {
      await operation();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function change(entry: Entry, operation: string) {
    if (
      operation === 'trash' &&
      !(await confirm('Excluir “' + entry.title + '”? O conteúdo ficará na lixeira por 30 dias.'))
    )
      return;
    await perform(async () => {
      await api('sections/' + entry.id + '/' + operation, 'POST');
      await refresh();
      if (operation === 'trash') {
        setUndoTrash(entry.id);
        setMessage('Conteúdo movido para a lixeira. Você pode desfazer.');
      } else
        setMessage(
          operation === 'restore'
            ? 'Conteúdo restaurado como rascunho.'
            : operation === 'activate'
              ? 'Conteúdo ativado no site.'
              : 'Conteúdo ocultado do site.',
        );
    });
  }
  if (loading)
    return (
      <main className="admin-shell grid min-h-dvh place-items-center">
        <p role="status">Carregando seu painel…</p>
      </main>
    );
  if (!user)
    return (
      <main className="admin-shell admin-login">
        <section className="admin-login-form">
          <Link href="/" className="text-sm font-medium text-gray-600">
            ← Voltar ao site
          </Link>
          <div>
            <p className="admin-eyebrow">ADMINISTRAÇÃO DO SITE</p>
            <h1>{setup ? 'Seu primeiro acesso.' : 'Bem-vindo de volta.'}</h1>
            <p className="admin-muted">
              {setup
                ? 'Crie o acesso responsável pelos conteúdos da UCP.'
                : 'Entre para cuidar dos conteúdos da UCP.'}
            </p>
            <form
              className="admin-form mt-8"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
                await perform(async () => {
                  await api(setup ? 'setup' : 'login', 'POST', data);
                  const s = await api('status');
                  setUser(s.user);
                  await refresh();
                  setMessage('');
                });
              }}
            >
              {setup && (
                <label>
                  Nome
                  <input name="name" required autoComplete="name" maxLength={150} />
                </label>
              )}
              <label>
                E-mail
                <input name="email" type="email" autoComplete="username" required />
              </label>
              <label>
                Senha
                <div className="relative">
                  <input
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    style={{ paddingRight: 48 }}
                    id="login-password"
                    autoComplete={setup ? 'new-password' : 'current-password'}
                    required
                    minLength={setup ? 12 : undefined}
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 grid h-9 w-10 place-items-center rounded-md text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={passwordVisible}
                    aria-controls="login-password"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {passwordVisible ? (
                        <>
                          <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.2A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.9M6.2 6.2A18 18 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 5.8-1.8" />
                        </>
                      ) : (
                        <>
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </label>
              {setup && <small>Use pelo menos 12 caracteres.</small>}
              <p role="alert" className="text-red-700">
                {message}
              </p>
              <button className="admin-primary w-full" disabled={busy}>
                {busy ? 'Entrando…' : setup ? 'Criar acesso' : 'Entrar no painel'}
              </button>
            </form>
            <p className="mt-6 text-xs text-gray-500">Acesso exclusivo para a equipe autorizada.</p>
          </div>
          <span className="text-xs text-gray-500">Faculdade do Centro do Paraná</span>
        </section>
        <aside className="admin-login-aside">
          <span className="admin-login-mark">UCP / CONTEÚDO</span>
          <div>
            <p className="text-sm font-medium text-white/70">
              SIMPLES DE ENCONTRAR. FÁCIL DE ATUALIZAR.
            </p>
            <h2>
              Um espaço para
              <br />
              manter a UCP
              <br />
              <span>sempre presente.</span>
            </h2>
            <p className="mt-6 max-w-sm text-white/80">
              Organize páginas, publique novidades e cuide de cada informação do site.
            </p>
          </div>
          <p className="text-sm text-white/65">Seu trabalho faz a informação chegar mais longe.</p>
        </aside>
      </main>
    );
  const isTrash = area === 'trash';
  const creatingPublication = modal === 'create' && area === 'publications';
  const title = isTrash ? 'Lixeira' : area === 'settings' ? 'Configurações da conta' : areas[area];
  const base = entries.filter(
    (e) => !e.purged && (isTrash ? Boolean(e.trashedAt) : !e.trashedAt && areaFor(e) === area),
  );
  const matches = base.filter(
    (e) =>
      (status === 'all' || e.status === status) &&
      (kind === 'all' || e.kind === kind) &&
      normalize(e.title + ' ' + publicPath(e.route)).includes(normalize(search)),
  );
  const directory = !['home', 'shared', 'courses', 'publications', 'trash'].includes(area);
  const visible = [...matches].sort((a, b) => {
    const depth = (e: Entry) => publicPath(e.route).split('/').filter(Boolean).length;
    return directory ? depth(a) - depth(b) || a.title.localeCompare(b.title, 'pt-BR') : 0;
  });
  const editorGroups = Array.from(
    new Set([...(section?.fieldGroups || []), ...(section?.textBlocks || []).map((b) => b.group)]),
  ).filter(Boolean);
  function pageLocation(entry: Entry) {
    if (entry.route === '/index.html') return 'Página inicial';
    const parts = publicPath(entry.route).split('/').filter(Boolean);
    if (parts.length === 1) return 'Página principal';
    const parent = entries.find((e) => publicPath(e.route) === '/' + parts.slice(0, -1).join('/'));
    return parent?.title || areas[area] || 'Página';
  }
  const kindNames: Record<string, string> = {
    section: 'Página ou seção',
    course: 'Curso',
    banner: 'Banner',
    publication: 'Publicação',
    runtime: 'Lista de conteúdo',
    shared: 'Conteúdo compartilhado',
  };
  return (
    <div className="admin-shell admin-layout">
      <aside className={'admin-sidebar ' + (mobile ? 'is-open' : '')}>
        <div className="admin-sidebar-heading">
          <strong>Administração</strong>
        </div>
        <nav aria-label="Áreas do site">
          {Object.entries(areas).map(([key, label]) => (
            <button key={key} className={area === key ? 'active' : ''} onClick={() => go(key)}>
              {label}
            </button>
          ))}
        </nav>
        <a href="/" target="_blank" rel="noopener" className="admin-site-link">
          Ver site ↗
        </a>
      </aside>
      {mobile && (
        <button
          className="admin-mobile-shade"
          aria-label="Fechar navegação"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="admin-main">
        <div className="admin-topbar">
          <button
            className="admin-mobile-toggle admin-button"
            onClick={() => setMobile(!mobile)}
            aria-expanded={mobile}
          >
            ☰ Menu
          </button>
          <Menu
            className="admin-account-menu"
            label={
              <span className="admin-account-button">
                <span>{user.name}</span>
                <span className="admin-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
                <span aria-hidden>⌄</span>
              </span>
            }
          >
            <div className="admin-account-summary">
              <small>Sua conta</small>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button
              onClick={() => {
                go('settings');
              }}
            >
              <AccountIcon type="settings" />
              <span>Configurações da conta</span>
            </button>
            <button onClick={() => go('trash')}>
              <AccountIcon type="trash" />
              <span>Lixeira</span>
            </button>
            <button className="text-red-700" onClick={() => void logout()}>
              Sair da conta
            </button>
          </Menu>
        </div>
        <main className="admin-content">
          <header className="admin-page-header">
            <div>
              <h1>{creatingPublication ? 'Nova publicação' : section ? section.title : title}</h1>
            </div>
            {creatingPublication && (
              <button className="admin-button" onClick={() => void closeModal()}>
                ← Voltar às publicações
              </button>
            )}
            {!creatingPublication &&
              !section &&
              !['trash', 'shared', 'settings'].includes(area) && (
                <button
                  className="admin-primary"
                  onClick={() => {
                    setModalDirty(false);
                    setModal('create');
                  }}
                >
                  ＋{' '}
                  {area === 'home'
                    ? 'Novo banner'
                    : area === 'courses'
                      ? 'Novo curso'
                      : area === 'publications'
                        ? 'Nova publicação'
                        : 'Nova página'}
                </button>
              )}
          </header>
          {message && (
            <div className="admin-message" role="status">
              <span>{message}</span>
              {undoTrash && (
                <button
                  onClick={() =>
                    void perform(async () => {
                      await api('sections/' + undoTrash + '/restore', 'POST');
                      await refresh();
                      setUndoTrash(null);
                      setMessage('Conteúdo restaurado como rascunho.');
                    })
                  }
                >
                  Desfazer exclusão
                </button>
              )}
              <button
                aria-label="Dispensar aviso"
                onClick={() => {
                  setMessage('');
                  setUndoTrash(null);
                }}
              >
                ✕
              </button>
            </div>
          )}
          {creatingPublication ? (
            <section className="admin-publication-create" aria-label="Criar publicação">
              <CreateForm
                area="publications"
                onDirty={() => setModalDirty(true)}
                onCreated={(id) => {
                  setModal(null);
                  setModalDirty(false);
                  void refresh();
                  void open(id, true);
                }}
              />
            </section>
          ) : area === 'settings' ? (
            <div className="admin-editor-body" style={{ maxWidth: 760 }}>
              <AccountForm
                user={user}
                onDirty={() => setModalDirty(true)}
                onSaved={(name) => {
                  setUser({ ...user, name });
                  setModalDirty(false);
                }}
              />
            </div>
          ) : !section ? (
            <>
              <div className="admin-toolbar">
                <label className="admin-search">
                  <span aria-hidden>⌕</span>
                  <input
                    aria-label="Pesquisar conteúdos"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar pelo nome da página ou conteúdo…"
                  />
                  {search && (
                    <button aria-label="Limpar pesquisa" onClick={() => setSearch('')}>
                      ✕
                    </button>
                  )}
                </label>
                <button
                  className={'admin-button ' + (filters ? 'selected' : '')}
                  aria-expanded={filters}
                  aria-controls="admin-filters"
                  onClick={() => setFilters(!filters)}
                >
                  Filtros{status !== 'all' || kind !== 'all' ? ' •' : ''} <span aria-hidden>⌄</span>
                </button>
              </div>
              {filters && (
                <div id="admin-filters" className="admin-filters">
                  <Select
                    label="Situação do conteúdo"
                    value={status}
                    onChange={setStatus}
                    options={[
                      { value: 'all', label: 'Todas as situações' },
                      { value: 'published', label: 'Publicado' },
                      { value: 'draft', label: 'Rascunho' },
                      { value: 'archived', label: 'Oculto' },
                    ]}
                  />
                  <Select
                    label="Tipo de conteúdo"
                    value={kind}
                    onChange={setKind}
                    options={[
                      { value: 'all', label: 'Todos os tipos' },
                      ...Array.from(new Set(base.map((e) => e.kind))).map((value) => ({
                        value,
                        label: kindNames[value] || value,
                      })),
                    ]}
                  />
                  <button
                    className="admin-button"
                    onClick={() => {
                      setStatus('all');
                      setKind('all');
                    }}
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
              <div className="admin-list-caption">
                <p>
                  {matches.length}{' '}
                  {directory
                    ? matches.length === 1
                      ? 'página encontrada'
                      : 'páginas encontradas'
                    : matches.length === 1
                      ? 'conteúdo encontrado'
                      : 'conteúdos encontrados'}
                </p>
                <div className="admin-view-controls">
                  <div
                    className="admin-view-switch"
                    role="group"
                    aria-label="Visualização dos conteúdos"
                  >
                    {(['list', 'grid'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={view === mode}
                        onClick={() => changeView(mode)}
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          aria-hidden="true"
                        >
                          {mode === 'list' ? (
                            <path d="M4 6h16M4 12h16M4 18h16" />
                          ) : (
                            <>
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <rect x="14" y="14" width="7" height="7" rx="1" />
                            </>
                          )}
                        </svg>
                        {mode === 'list' ? 'Lista' : 'Grade'}
                      </button>
                    ))}
                  </div>
                  <div className="admin-legend">
                    <span className="status-dot published" />
                    Publicado <span className="status-dot draft" />
                    Rascunho <span className="status-dot archived" />
                    Oculto
                  </div>
                </div>
              </div>
              <div className={'admin-card-grid' + (view === 'list' ? ' admin-page-list' : '')}>
                {visible.map((e) => (
                  <article className="admin-content-card" key={e.id}>
                    <div className="flex items-start justify-between gap-3">
                      <span className={'admin-badge ' + (e.trashedAt ? 'trash' : e.status)}>
                        <span className="status-dot" />
                        {e.trashedAt ? 'Na lixeira' : stateLabels[e.status]}
                      </span>
                      <Menu label="Mais opções">
                        <button onClick={() => void open(e.id)} disabled={Boolean(e.trashedAt)}>
                          Editar conteúdo
                        </button>
                        {!['shared', 'runtime'].includes(e.kind) && !e.trashedAt && (
                          <>
                            <button
                              onClick={() =>
                                void change(e, e.status === 'archived' ? 'activate' : 'hide')
                              }
                              disabled={e.status === 'draft'}
                            >
                              {e.status === 'archived' ? 'Ativar' : 'Ocultar'}
                            </button>
                            <button
                              className="text-red-700"
                              onClick={() => void change(e, 'trash')}
                            >
                              Excluir
                            </button>
                          </>
                        )}
                        {e.trashedAt && (
                          <button onClick={() => void change(e, 'restore')}>
                            Restaurar como rascunho
                          </button>
                        )}
                      </Menu>
                    </div>
                    <button
                      disabled={Boolean(e.trashedAt)}
                      onClick={() => void open(e.id)}
                      className="admin-card-title"
                    >
                      {e.title}
                    </button>
                    <p className="admin-muted text-sm">
                      {directory
                        ? pageLocation(e)
                        : e.route === '/index.html'
                          ? 'Página inicial · ' + (kindNames[e.kind] || 'Seção')
                          : e.title}
                    </p>
                    <footer>
                      {e.trashedAt ? (
                        <span className="text-sm text-red-700">
                          Disponível até{' '}
                          {new Date(Date.parse(e.trashedAt) + 30 * 86400000).toLocaleDateString(
                            'pt-BR',
                          )}
                        </span>
                      ) : (
                        <button className="admin-edit-link" onClick={() => void open(e.id)}>
                          Editar conteúdo
                        </button>
                      )}
                    </footer>
                  </article>
                ))}
              </div>
              {!visible.length && (
                <div className="admin-empty">
                  <h2>{isTrash ? 'A lixeira está vazia.' : 'Nenhum conteúdo encontrado.'}</h2>
                  <p>Tente outro termo ou limpe os filtros.</p>
                  <button
                    className="admin-button"
                    onClick={() => {
                      setSearch('');
                      setStatus('all');
                      setKind('all');
                    }}
                  >
                    Limpar pesquisa e filtros
                  </button>
                </div>
              )}
            </>
          ) : (
            <section>
              <button
                className="admin-edit-link mb-5"
                onClick={async () => {
                  if (await leave()) {
                    setSection(null);
                    setDirty(false);
                  }
                }}
              >
                ← Voltar para {title}
              </button>
              <div className="admin-editor-toolbar">
                <span className="admin-muted">
                  {dirty ? '● Alterações não salvas' : 'Conteúdo carregado'} ·{' '}
                  {publicPath(section.route)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="admin-button"
                    disabled={!history.length || busy}
                    onClick={() => {
                      const previous = history.at(-1);
                      if (previous) {
                        setSection(previous);
                        setHistory(history.slice(0, -1));
                        setDirty(true);
                      }
                    }}
                  >
                    ↶ Desfazer
                  </button>
                  <button
                    className="admin-button"
                    disabled={busy}
                    onClick={() => void perform(save)}
                  >
                    Salvar rascunho
                  </button>
                  <button
                    className="admin-button"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        if (dirty) await save();
                        setModal('preview');
                      })
                    }
                  >
                    Conferir prévia
                  </button>
                  <button
                    className="admin-primary"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        if (!(await confirm('Publicar as alterações de “' + section.title + '”?')))
                          return;
                        if (dirty) await save();
                        await api('sections/' + section.id + '/publish', 'POST');
                        setSection(await api('sections/' + section.id));
                        await refresh();
                        setMessage('Alterações publicadas no site.');
                      })
                    }
                  >
                    Publicar alterações
                  </button>
                </div>
              </div>
              <div className="admin-editor-body">
                {section.kind === 'publication' && (
                  <>
                    <label>
                      Data da publicação
                      <input
                        type="datetime-local"
                        value={
                          section.publicationDate
                            ? new Date(
                                new Date(section.publicationDate).getTime() -
                                  new Date(section.publicationDate).getTimezoneOffset() * 60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ''
                        }
                        onChange={(e) =>
                          edit((d) => {
                            d.publicationDate = e.target.value
                              ? new Date(e.target.value).toISOString()
                              : '';
                          })
                        }
                      />
                    </label>
                    <PublicationEditor
                      blocks={section.publicationBlocks || []}
                      onChange={(blocks) =>
                        edit((d) => {
                          d.publicationBlocks = blocks;
                        })
                      }
                    />
                  </>
                )}
                {editorGroups.length > 1 && (
                  <Select
                    label="Conteúdo da página"
                    value={part}
                    onChange={setPart}
                    options={[
                      { value: '', label: 'Mostrar tudo' },
                      ...editorGroups.map((value) => ({ value, label: value })),
                    ]}
                  />
                )}
                {section.collection && (
                  <CollectionEditor
                    value={section.collection}
                    onChange={(collection) =>
                      edit((d) => {
                        d.collection = collection;
                        d.collectionChanged = true;
                      })
                    }
                  />
                )}
                {section.textBlocks
                  ?.filter((block) => !part || block.group === part)
                  .map((block) => (
                    <section className="admin-text-block" key={section.id + '-' + block.id}>
                      <h3>{block.label}</h3>
                      {block.kind === 'heading' ? (
                        <input
                          className="admin-input"
                          aria-label={block.label}
                          maxLength={400}
                          value={block.value}
                          onChange={(e) =>
                            edit((d) => {
                              d.textBlocks!.find((b) => b.id === block.id)!.value = e.target.value;
                              d.blocksChanged = {
                                ...d.blocksChanged,
                                [block.id]: e.target.value,
                              };
                            })
                          }
                        />
                      ) : (
                        <RichTextEditor
                          label={block.label}
                          value={block.value}
                          onChange={(value) =>
                            edit((d) => {
                              d.textBlocks!.find((b) => b.id === block.id)!.value = value;
                              d.blocksChanged = { ...d.blocksChanged, [block.id]: value };
                            })
                          }
                        />
                      )}
                    </section>
                  ))}
                <div className="admin-form">
                  {section.fields.map((field, index) => {
                    if (field.hidden) return null;
                    if (
                      section.collection?.fieldIndices.includes(index) ||
                      section.textBlocks?.some((block) => block.fieldIndices.includes(index))
                    )
                      return null;
                    if (part && section.fieldGroups?.[index] !== part) return null;
                    return (
                      <label key={index}>
                        {field.label || 'Conteúdo'}
                        {field.kind === 'image' && (
                          <>
                            <img
                              src={imagePreviewURL(field.value, section.route)}
                              alt={field.label}
                              className="admin-image-preview"
                            />
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  void perform(async () => {
                                    const result = await upload(file);
                                    edit((d) => {
                                      d.fields[index].value = result.url;
                                    });
                                  });
                              }}
                            />
                          </>
                        )}
                        {field.kind === 'text' && field.value.length > 100 ? (
                          <textarea
                            rows={5}
                            value={field.value}
                            onChange={(e) =>
                              edit((d) => {
                                d.fields[index].value = e.target.value;
                              })
                            }
                          />
                        ) : (
                          <input
                            inputMode={field.kind === 'image' ? 'url' : undefined}
                            placeholder={
                              field.kind === 'image'
                                ? 'Cole o link da imagem: https://…'
                                : undefined
                            }
                            aria-label={
                              field.kind === 'image' ? 'Link da imagem — ' + field.label : undefined
                            }
                            value={field.value}
                            onChange={(e) =>
                              edit((d) => {
                                d.fields[index].value = e.target.value;
                              })
                            }
                          />
                        )}
                      </label>
                    );
                  })}
                  {
                    <details className="admin-documents-panel" open={section.documents.length > 0}>
                      <summary>Documentos e PDFs</summary>
                      {section.documents.map((doc, index) => (
                        <div className="admin-document" key={index}>
                          <label>
                            Título
                            <input
                              value={doc.title}
                              onChange={(e) =>
                                edit((d) => {
                                  d.documents[index].title = e.target.value;
                                })
                              }
                            />
                          </label>
                          <label>
                            Arquivo ou link
                            <input
                              value={doc.url}
                              onChange={(e) =>
                                edit((d) => {
                                  d.documents[index].url = e.target.value;
                                })
                              }
                            />
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  void perform(async () => {
                                    const result = await upload(file);
                                    edit((d) => {
                                      d.documents[index].url = result.url;
                                    });
                                  });
                              }}
                            />
                          </label>
                          <button
                            className="admin-button"
                            onClick={() =>
                              edit((d) => {
                                d.documents.splice(index, 1);
                              })
                            }
                          >
                            Remover documento
                          </button>
                        </div>
                      ))}
                      <button
                        className="admin-button mt-4"
                        onClick={() =>
                          edit((d) => {
                            d.documents.push({ title: '', url: '' });
                          })
                        }
                      >
                        ＋ Adicionar documento
                      </button>
                    </details>
                  }
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
      {modal === 'create' && area !== 'publications' && (
        <Modal
          wide={area === 'publications'}
          title={
            area === 'home'
              ? 'Novo banner'
              : area === 'courses'
                ? 'Novo curso'
                : area === 'publications'
                  ? 'Nova publicação'
                  : 'Nova página'
          }
          onClose={closeModal}
        >
          <CreateForm
            area={area}
            parents={Array.from(
              new Map(
                entries
                  .filter((e) => areaFor(e) === area && !e.trashedAt && e.kind !== 'runtime')
                  .map((e) => [
                    publicPath(e.route),
                    { value: publicPath(e.route), label: e.title + ' · ' + publicPath(e.route) },
                  ]),
              ).values(),
            )}
            onDirty={() => setModalDirty(true)}
            onCreated={(id) => {
              setModal(null);
              setModalDirty(false);
              void refresh();
              void open(id, true);
            }}
          />
        </Modal>
      )}
      {modal === 'preview' && section && (
        <Modal title="Prévia do rascunho — ainda não publicada" wide onClose={() => setModal(null)}>
          <iframe
            className="admin-preview"
            title="Prévia do conteúdo"
            sandbox="allow-same-origin"
            src={'/api/admin/sections/' + section.id + '/preview'}
          />
        </Modal>
      )}
    </div>
  );
}
