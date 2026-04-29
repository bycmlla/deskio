# HelpDesk TI

Sistema web para abertura, acompanhamento e gerenciamento de chamados de suporte de TI.

## Estrutura do Projeto

```
helpdesk/
├── backend/          # API Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── database.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── public/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
└── docker-compose.yml
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- (ou Docker + Docker Compose)

## Rodando com Docker (recomendado)

```bash
docker-compose up -d
```

Acesse:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/health

## Rodando manualmente

### Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais do banco
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Credenciais padrão

Ao iniciar o backend pela primeira vez, um usuário admin é criado automaticamente:

- **E-mail:** admin@helpdesk.com
- **Senha:** admin123

> ⚠️ Altere a senha em produção!

## Stack

- **Frontend:** React 18, React Router v6, React Hook Form, Zod, Axios, Vite
- **Backend:** Node.js, Express, Sequelize ORM, JWT, Bcrypt
- **Banco:** PostgreSQL

## Rotas

### Área Pública
| Rota | Descrição |
|------|-----------|
| `/` | Abrir chamado |
| `/chamado/confirmacao/:protocolo` | Confirmação após abertura |
| `/chamado/:protocolo` | Detalhes do chamado |
| `/chamados` | Listagem pública |

### Painel Administrativo
| Rota | Descrição |
|------|-----------|
| `/admin/login` | Login |
| `/admin` | Dashboard |
| `/admin/chamados` | Listagem administrativa |
| `/admin/chamados/:id` | Detalhes + ações |
| `/admin/setores` | Gerenciar setores |

## Endpoints da API

### Públicos
- `POST /api/chamados` — Criar chamado
- `GET /api/chamados` — Listar chamados (paginado, filtro por status)
- `GET /api/chamados/:protocolo` — Buscar por protocolo
- `GET /api/setores` — Listar setores ativos

### Administrativos (requer JWT)
- `POST /api/admin/login`
- `GET /api/admin/dashboard`
- `GET /api/admin/chamados` — Lista com filtros
- `GET /api/admin/chamados/:id` — Detalhes completos
- `PATCH /api/admin/chamados/:id/status`
- `PATCH /api/admin/chamados/:id/tecnico`
- `POST /api/admin/chamados/:id/observacoes`
- `GET /api/admin/chamados/:id/historico`
- `GET /api/admin/setores`
- `POST /api/admin/setores` (admin only)
- `PATCH /api/admin/setores/:id` (admin only)
- `PATCH /api/admin/setores/:id/status` (admin only)
- `GET /api/admin/tecnicos`

## Formato do Protocolo

`TK + YYMMDD + 4 dígitos + letra aleatória`

Exemplo: `TK260428906E`

## Permissões

| Funcionalidade | Admin | Técnico |
|---------------|-------|---------|
| Ver chamados | ✅ | ✅ |
| Alterar status | ✅ | ✅ (atribuídos) |
| Atribuir técnico | ✅ | ❌ |
| Observações internas | ✅ | ✅ |
| Gerenciar setores | ✅ | ❌ |
