# `lib/device.ts`

Arquivo-fonte: [lib/device.ts](../../lib/device.ts)

## Responsabilidade

Gera um identificador anônimo persistido no navegador.

## Funcionamento

- Procura `saude_rapida_device_id` no `localStorage`.
- Se não existir, gera UUID com `crypto.randomUUID`.
- Se o armazenamento falhar, gera UUID temporário para aquela sessão.

O usuário não possui login; o dispositivo é o mecanismo de limite de relatos.
