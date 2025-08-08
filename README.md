# Aplicativo de Orações

Uma aplicação web para gerar orações personalizadas usando IA.

## Pré-requisitos

- Node.js 18.0.0 ou superior
- NPM 8.0.0 ou superior

## Executando o Projeto

```bash
npm install
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## Variáveis de Ambiente

Adicione no `.env.local` (ou na Vercel → Project Settings → Environment Variables):

```
# Deixe vazio para usar o mock
OPENAI_API_KEY=

# 1 para usar mock (padrão de desenvolvimento), 0 para usar a OpenAI real
MOCK_OPENAI=1
```

Notas:
- Se `MOCK_OPENAI=1` ou `OPENAI_API_KEY` estiver vazia, a API usa o modo de teste (mock).
- Para usar a OpenAI real, defina `MOCK_OPENAI=0` e informe `OPENAI_API_KEY`.

## Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com) e conecte seu GitHub
2. Importe o repositório `oracoes-app`
3. Configure as variáveis de ambiente acima
4. Clique em Deploy

Após o deploy, você terá um link público para o app.

## Funcionalidades

- Splash screen de boas-vindas
- Interface simples para inserção do motivo de oração
- Geração de orações personalizadas (mock ou OpenAI)
- Botão para copiar a oração gerada
- Design responsivo e minimalista