# Kanban Board
A NestJS backend application featuring authentication, PostgreSQL, Redis, and Prisma ORM.

### Tech Stack
- NestJS – Progressive Node.js framework
- Prisma – Modern ORM for PostgreSQL
- PostgreSQL – Relational database
- Redis – Caching and queuing
- Docker + Docker Compose – Containerization
- JWT – Authentication with JSON Web Tokens

### Quick Start
1. Clone repo
```bash
git clone https://github.com/DimaTeniuta/kanban-board-api.git
```

2. Create `.env` file

```bash
cd kanban-board-api
cp .env.example .env
```
- Set `JWT_SECRET`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`
- Update `POSTGRES_URI` and `REDIS_URI` with the same passwords (Docker-internal hosts: `postgres:5432`, `redis:6379`)

3. Start App
```bash
yarn docker:compose:prod   # production build
yarn docker:compose:dev   # hot-reload
```
Migrations run automatically on container start.

Your backend will be available at `http://localhost:4000`.

### API Documentation (Swagger)
This project uses Swagger (via @nestjs/swagger) to provide interactive API documentation.

Once the application is running, you can access Swagger at:
`http://localhost:4000/api`
