# Contrato de dados v1

> Combinado entre **M1 (front)** e **M2 (back)**. Qualquer mudança aqui exige Pull Request
> com aprovação dos dois. O mesmo formato existe em código em `/types/unidade.ts`.
> Se este arquivo e o tipo divergirem, **corrija o tipo para bater com este arquivo**.

## Convenções gerais

| Item | Decisão |
|---|---|
| Nomes dos campos | `snake_case`, em português |
| Tempo | sempre em **minutos** (inteiros) |
| Distância | sempre em **km** (uma casa decimal) |
| Datas | ISO 8601 em UTC (`2026-11-20T14:30:00Z`) |
| Ordem da lista | a API já devolve ordenada por `total_min` (menor primeiro); o front só exibe |
| Sem dados de espera | `espera_min: null` (nunca `0`) |
| Formato de erro | `{ "erro": "codigo_curto", "mensagem": "texto legível" }` |

---

## 1. `GET /api/unidades?lat=-23.50&lng=-47.45`

Retorna as unidades cadastradas com espera, tempo de viagem e total.

**Parâmetros (query):**

| Nome | Tipo | Regra |
|---|---|---|
| `lat` | number | entre -90 e 90 |
| `lng` | number | entre -180 e 180 |

Se o GPS do usuário for negado, o front envia o centro da cidade.

**Resposta `200`:**

```json
{
  "origem": { "lat": -23.50, "lng": -47.45 },
  "unidades": [
    {
      "id": "uuid",
      "nome": "UPA Zona Norte",
      "endereco": "Rua X, 100",
      "lat": -23.48,
      "lng": -47.44,
      "espera_min": 45,
      "n_relatos": 7,
      "ultimo_relato_em": "2026-11-20T14:30:00Z",
      "viagem_min": 12,
      "distancia_km": 5.3,
      "total_min": 57,
      "fonte_viagem": "transito"
    }
  ]
}
```

**Campos de cada unidade:**

| Campo | Tipo | Significado |
|---|---|---|
| `id` | string (uuid) | identificador da unidade |
| `nome`, `endereco` | string | texto para exibição |
| `lat`, `lng` | number | coordenadas da unidade |
| `espera_min` | number \| null | **mediana** dos relatos válidos das últimas 3 h; `null` se não houver |
| `n_relatos` | number | quantos relatos entraram no cálculo (0 se `espera_min` for `null`) |
| `ultimo_relato_em` | string \| null | data do relato mais recente usado; `null` se não houver |
| `viagem_min` | number | tempo de deslocamento até a unidade |
| `distancia_km` | number | distância da rota |
| `total_min` | number | `viagem_min + (espera_min ?? 0)` |
| `fonte_viagem` | `"transito"` \| `"estimado"` | `transito` = veio da API de rotas com trânsito; `estimado` = fallback por distância em linha reta |

**Regras:**
- Se `espera_min` for `null`, o `total_min` considera só a viagem e o front mostra "sem relatos recentes".
- Se `fonte_viagem` for `"estimado"`, o front mostra um selo "estimado".

**Erros:**

| Status | `erro` | Quando |
|---|---|---|
| 400 | `parametros_invalidos` | `lat`/`lng` ausentes, não numéricos ou fora do intervalo |
| 500 | `erro_interno` | falha inesperada (o fallback de rota deve evitar que a falha da API de rotas chegue aqui) |

---

## 2. `POST /api/relatos`

Registra quanto tempo o usuário esperou (ou está esperando) em uma unidade.

**Corpo (JSON):**

```json
{
  "unidade_id": "uuid",
  "minutos": 40,
  "device_id": "uuid"
}
```

| Campo | Tipo | Regra |
|---|---|---|
| `unidade_id` | string (uuid) | deve existir em `unidades` |
| `minutos` | integer | de **1** a **720** |
| `device_id` | string (uuid) | gerado no navegador (`crypto.randomUUID()`) e guardado no `localStorage` |

**Resposta `201`:**

```json
{ "ok": true, "relato_id": "uuid" }
```

**Erros:**

| Status | `erro` | Quando | Mensagem sugerida na tela |
|---|---|---|---|
| 422 | `valor_invalido` | `minutos` fora de 1–720, não inteiro, ou campos ausentes | "Informe um tempo entre 1 e 720 minutos." |
| 404 | `unidade_inexistente` | `unidade_id` não existe | "Unidade não encontrada." |
| 429 | `relato_recente` | mesmo `device_id` já relatou esta unidade há menos de 30 min | "Você já informou o tempo desta unidade há pouco. Tente novamente mais tarde." |
| 500 | `erro_interno` | falha inesperada | "Algo deu errado. Tente de novo." |

---

## 3. Regras de negócio (implementadas no servidor)

| Regra | Valor |
|---|---|
| Janela de relatos considerada | últimas **3 horas** |
| Valores aceitos | **1 a 720** minutos |
| Estatística usada | **mediana** (não a média) |
| Limite por dispositivo | 1 relato por unidade a cada **30 minutos** |
| Cache de rotas | **5 minutos**, por unidade e por célula de grade da origem (~500 m) |

---

## 4. Como alterar este contrato

1. Quem precisa da mudança abre um Pull Request alterando **`docs/contrato.md` e `types/unidade.ts`** juntos.
2. O outro membro (M1 ou M2) aprova.
3. Só depois o código que depende da mudança é escrito.
4. Se a mudança quebra compatibilidade, incremente a versão no título (v2).
