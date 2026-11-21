/**
 * Contrato de dados v1 (espelho de /docs/contrato.md).
 * Front (M1) e back (M2) importam DAQUI. Não redefinam estes tipos em outro lugar.
 * Se o contrato mudar: altere este arquivo e docs/contrato.md no MESMO Pull Request.
 */

// ---------------------------------------------------------------------------
// Constantes de negócio (usar no servidor e, quando fizer sentido, na validação do front)
// ---------------------------------------------------------------------------
export const LIMITES = {
  MINUTOS_MIN: 1,
  MINUTOS_MAX: 720,
  JANELA_RELATOS_HORAS: 3,
  INTERVALO_ENTRE_RELATOS_MIN: 30,
  CACHE_ROTA_MIN: 5,
  GRADE_ORIGEM_GRAUS: 0.005, // ~500 m
} as const;

// ---------------------------------------------------------------------------
// GET /api/unidades
// ---------------------------------------------------------------------------
export type FonteViagem = "transito" | "estimado";

export type Unidade = {
  id: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  /** Mediana dos relatos válidos das últimas 3 h. null = ninguém relatou. Nunca usar 0 para "sem dados". */
  espera_min: number | null;
  n_relatos: number;
  /** Data ISO (UTC) do relato mais recente usado no cálculo, ou null. */
  ultimo_relato_em: string | null;
  viagem_min: number;
  distancia_km: number;
  /** viagem_min + (espera_min ?? 0) */
  total_min: number;
  fonte_viagem: FonteViagem;
};

export type Coordenada = {
  lat: number;
  lng: number;
};

export type RespostaUnidades = {
  origem: Coordenada;
  /** Já ordenada por total_min, do menor para o maior. */
  unidades: Unidade[];
};

// ---------------------------------------------------------------------------
// POST /api/relatos
// ---------------------------------------------------------------------------
export type NovoRelato = {
  unidade_id: string;
  /** Inteiro entre LIMITES.MINUTOS_MIN e LIMITES.MINUTOS_MAX. */
  minutos: number;
  /** UUID gerado no navegador (crypto.randomUUID) e guardado no localStorage. */
  device_id: string;
};

export type RespostaRelato = {
  ok: true;
  relato_id: string;
};

// ---------------------------------------------------------------------------
// Erros (formato único para toda a API)
// ---------------------------------------------------------------------------
export type CodigoErro =
  | "parametros_invalidos" // 400 (GET /api/unidades)
  | "valor_invalido" //       422 (POST /api/relatos)
  | "unidade_inexistente" //  404 (POST /api/relatos)
  | "relato_recente" //       429 (POST /api/relatos)
  | "erro_interno"; //        500

export type ErroApi = {
  erro: CodigoErro;
  mensagem: string;
};
