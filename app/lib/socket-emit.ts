const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3001";

export async function emitSocketEvent(event: string, data: unknown): Promise<void> {
  try {
    await fetch(`${SOCKET_URL}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, data }),
    });
  } catch (err) {
    console.error("[socket-emit] Erro ao emitir evento:", event, err);
  }
}
