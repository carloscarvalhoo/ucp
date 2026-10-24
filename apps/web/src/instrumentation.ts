export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const globalState = globalThis as unknown as { ucpTrashTimer?: ReturnType<typeof setInterval> };
    if (!globalState.ucpTrashTimer) {
      const { trash } = await import('./lib/services');
      const cleanup = () =>
        trash
          .purge()
          .catch((error: { code?: string }) =>
            console.error('Não foi possível limpar a lixeira:', error.code || 'falha de conexão'),
          );
      await cleanup();
      globalState.ucpTrashTimer = setInterval(cleanup, 3600000);
      globalState.ucpTrashTimer.unref();
    }
  }
}
