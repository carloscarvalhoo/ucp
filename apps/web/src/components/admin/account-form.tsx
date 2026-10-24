'use client';
import { useState } from 'react';
import { api } from './model';
export type User = { id: number; name: string; email: string; role: string };
export function AccountForm({
  user,
  onSaved,
  onDirty,
}: {
  user: User;
  onSaved: (name: string) => void;
  onDirty: () => void;
}) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-form"
      onChange={onDirty}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        setBusy(true);
        try {
          await api('account', 'PUT', data);
          onSaved(String(data.name).trim());
          setMessage('Configurações salvas.');
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Seu nome
        <input name="name" defaultValue={user.name} required maxLength={150} autoComplete="name" />
      </label>
      <label>
        E-mail de acesso
        <input value={user.email} readOnly />
      </label>
      <p role="status">{message}</p>
      <button className="admin-primary" disabled={busy}>
        {busy ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </form>
  );
}
