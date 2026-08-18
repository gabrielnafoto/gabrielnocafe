# o setup — página de links pessoal

Plataforma minimalista para compartilhar equipamentos, links e ferramentas.  
Design editorial dark, painel admin com senha, persistência via Vercel KV.

---

## Deploy no Vercel (passo a passo)

### 1. Suba o código no GitHub

Crie um repositório no GitHub e faça push deste projeto:

```bash
git init
git add .
git commit -m "primeiro commit"
git remote add origin https://github.com/SEU_USER/SEU_REPO.git
git push -u origin main
```

### 2. Importe no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **Add New → Project**
3. Selecione seu repositório do GitHub
4. Clique em **Deploy** (sem configurar nada ainda)

### 3. Adicione a senha do admin

No painel do Vercel, vá em:  
**Settings → Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `ADMIN_PASSWORD` | `sua-senha-aqui` |

Depois vá em **Deployments → Re-deploy** para aplicar.

### 4. Adicione o Vercel KV (para salvar conteúdo)

1. No painel do projeto, vá em **Storage → Create Database → KV**
2. Dê um nome (ex: `setup-kv`) e clique em **Create**
3. Na tela seguinte, clique em **Connect to Project**
4. Faça um novo deploy (**Deployments → Re-deploy**)

Sem o KV, o site funciona com o conteúdo padrão definido em `lib/data.js`.  
Com o KV, tudo que você salvar no admin persiste entre deploys.

---

## Páginas

| URL | Descrição |
|-----|-----------|
| `/` | Página pública do setup |
| `/admin` | Painel de edição (requer senha) |
| `/api/data` | API REST do conteúdo |

---

## Como editar conteúdo

1. Acesse `seu-dominio.vercel.app/admin`
2. Digite a senha configurada no Vercel
3. Edite seções, itens, perfil e textos
4. Clique em **Salvar tudo**

---

## Estrutura do projeto

```
cafe-setup/
├── api/
│   └── data.js          # API serverless (GET e POST)
├── lib/
│   └── data.js          # Conteúdo padrão
├── public/
│   ├── index.html       # Página pública
│   └── admin.html       # Painel admin
├── vercel.json          # Rotas e variáveis de ambiente
├── package.json
└── README.md
```

---

## Personalizando

- **Cores e tipografia**: edite as variáveis `:root` em `public/index.html`
- **Conteúdo inicial**: edite `lib/data.js` (usado quando o KV está vazio)
- **Adicionar seções/itens**: use o painel `/admin`
