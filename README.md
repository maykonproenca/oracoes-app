# Aplicativo de Orações

Uma aplicação web para gerar orações personalizadas usando IA.

## Pré-requisitos

- Node.js 18.0.0 ou superior
- NPM 8.0.0 ou superior

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd oracoes-app
```

2. Instale as dependências:
```bash
npm install
```

## Executando o Projeto

Para rodar o projeto em ambiente de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## Modo de Teste

Atualmente o aplicativo está funcionando em modo de teste, utilizando orações pré-definidas para simular a geração de orações personalizadas. Isso permite testar a funcionalidade sem necessidade de uma chave da API da OpenAI.

### Para ativar o modo com IA (quando disponível):

1. Configure as variáveis de ambiente:
   - Crie um arquivo `.env.local` na raiz do projeto
   - Adicione sua chave da API OpenAI:
```
OPENAI_API_KEY=sua_chave_aqui
```

2. Modifique o arquivo `app/api/oracao/route.ts` para usar a API da OpenAI

## Deploy na Vercel

1. Crie uma conta na [Vercel](https://vercel.com) se ainda não tiver
2. Instale a CLI da Vercel:
```bash
npm install -g vercel
```

3. Faça login na sua conta:
```bash
vercel login
```

4. Deploy do projeto:
```bash
vercel
```

5. Para o modo com IA, configure a variável de ambiente `OPENAI_API_KEY` no painel da Vercel:
   - Acesse as configurações do projeto
   - Vá para a seção "Environment Variables"
   - Adicione a variável `OPENAI_API_KEY` com sua chave da API OpenAI

## Funcionalidades

- Splash screen de boas-vindas
- Interface simples para inserção do motivo de oração
- Geração de orações personalizadas (modo de teste)
- Botão para copiar a oração gerada
- Design responsivo e minimalista