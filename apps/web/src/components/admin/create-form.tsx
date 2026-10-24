'use client';
import { PublicationEditor } from './publication-editor';
import type { PublicationBlock } from '@/lib/publication-blocks';
import { useState } from 'react';
import { api, upload } from './model';
import { Select } from './select';
export function CreateForm({
  area,
  parents = [],
  onCreated,
  onDirty,
}: {
  area: string;
  parents?: { value: string; label: string }[];
  onCreated: (id: number) => void;
  onDirty: () => void;
}) {
  const [blocks, setBlocks] = useState<PublicationBlock[]>([]);
  const [type, setType] = useState('noticias'),
    [mode, setMode] = useState('Presencial'),
    [image, setImage] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [parent, setParent] = useState(parents[0]?.value || '/institucional');
  const coverFields = (
    <>
      <label>
        Imagem
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            try {
              setImage((await upload(file)).url);
            } catch (error) {
              setMessage((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
        <small>JPG, PNG ou WebP, até 10 MB.</small>
      </label>
      {image && <img src={image} alt="Imagem selecionada" className="admin-image-preview" />}
      <label>
        Link da imagem
        <input
          inputMode="url"
          placeholder="https://exemplo.com/imagem.jpg"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          required={area === 'home'}
        />
      </label>
    </>
  );
  return (
    <form
      className="admin-form"
      onChange={onDirty}
      onSubmit={async (e) => {
        e.preventDefault();
        if (area === 'publications' && !blocks.length) {
          setMessage('Adicione pelo menos um bloco ao conteúdo.');
          return;
        }
        const data = Object.fromEntries(new FormData(e.currentTarget));
        setBusy(true);
        try {
          const result = await api(
            area === 'publications'
              ? 'publications'
              : ['home', 'courses'].includes(area)
                ? 'catalog'
                : 'pages',
            'POST',
            {
              ...data,
              type:
                area === 'home'
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
            },
          );
          onCreated(result.id);
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      {!['home', 'courses', 'publications'].includes(area) && (
        <Select
          label="Dentro de qual página?"
          value={parent}
          onChange={(value) => {
            setParent(value);
            onDirty();
          }}
          options={parents.length ? parents : [{ value: '/institucional', label: 'Institucional' }]}
        />
      )}
      {area === 'publications' ? (
        <div className="publication-meta-grid">
          <label className="publication-meta-title">
            Título
            <input name="title" required maxLength={255} />
          </label>
          <Select
            label="Tipo de publicação"
            value={type}
            onChange={(value) => {
              setType(value);
              onDirty();
            }}
            options={[
              { value: 'noticias', label: 'Notícia' },
              { value: 'blog', label: 'Blog' },
              { value: 'eventos', label: 'Evento' },
            ]}
          />
          <label>
            Data da publicação
            <input name="publicationDate" type="datetime-local" />
          </label>
          <label className="publication-meta-title">
            Endereço da publicação
            <input name="slug" placeholder="Gerado a partir do título" maxLength={100} />
          </label>
        </div>
      ) : (
        <label>
          Título
          <input name="title" required maxLength={255} />
        </label>
      )}
      {area === 'courses' && (
        <>
          <Select
            label="Modalidade"
            value={mode}
            onChange={(value) => {
              setMode(value);
              onDirty();
            }}
            options={[
              { value: 'Presencial', label: 'Presencial' },
              { value: 'Smart', label: 'Smart' },
            ]}
          />
          <label>
            Duração
            <input name="duration" placeholder="Ex.: 4 anos" required />
          </label>
          <label>
            Diploma
            <input name="diploma" placeholder="Ex.: Bacharelado" required />
          </label>
          <label>
            Período
            <input name="period" placeholder="Ex.: Noturno" />
          </label>
        </>
      )}
      {area !== 'home' && area !== 'publications' && (
        <label>
          Texto de apresentação
          <textarea name="body" required={area !== 'publications' || !blocks.length} rows={5} />
        </label>
      )}
      {area === 'publications' ? (
        <details className="publication-cover-settings">
          <summary>Imagem de capa</summary>
          {coverFields}
        </details>
      ) : (
        coverFields
      )}
      {area === 'publications' && (
        <PublicationEditor
          blocks={blocks}
          onChange={(b) => {
            setBlocks(b);
            onDirty();
          }}
        />
      )}
      {area === 'home' && (
        <label>
          Ao clicar no banner, abrir
          <input name="link" placeholder="Ex.: /vestibular" required />
        </label>
      )}
      <div className={area === 'publications' ? 'publication-create-actions' : undefined}>
        <p role="status">{message}</p>
        <p className="admin-muted">
          O novo conteúdo será criado como rascunho. Você poderá revisar antes de publicar.
        </p>
        <button disabled={busy} className="admin-primary">
          {busy ? 'Preparando…' : 'Criar rascunho'}
        </button>
      </div>
    </form>
  );
}
