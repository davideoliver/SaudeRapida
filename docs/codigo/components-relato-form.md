# `components/RelatoForm.tsx`

Arquivo-fonte: [components/RelatoForm.tsx](../../components/RelatoForm.tsx)

## Responsabilidade

Coleta o tempo de espera informado pelo usuário e envia para `POST /api/relatos`.

## Estados

- `texto`: entrada digitada.
- `enviando`: impede novo envio durante a requisição.
- `erro`: mensagem exibida no formulário.
- `enviado`: confirma sucesso e troca o formulário pela mensagem final.

## Validação no navegador

- Aceita somente dígitos por meio de `/^\d+$/`.
- Aceita valores entre 1 e 720 minutos.
- Usa `LIMITES` compartilhados com o contrato.

Essa validação melhora a experiência, mas não é uma garantia de segurança: o servidor valida novamente.

## Pedido

Envia `unidade_id`, `minutos` e `device_id`. O identificador vem de `getDeviceId`.

## Erros

Erros da API são tratados por `ErroDaApi` e exibem `mensagem`. Falta de conexão usa uma mensagem genérica.
