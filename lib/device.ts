const CHAVE = "saude_rapida_device_id";

// Só chamar no navegador (dentro de um clique ou de um useEffect).
export function getDeviceId(): string {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return salvo;
    const novo = crypto.randomUUID();
    localStorage.setItem(CHAVE, novo);
    return novo;
  } catch {
    // localStorage bloqueado: usa um id temporário (vale só até recarregar)
    return crypto.randomUUID();
  }
}
