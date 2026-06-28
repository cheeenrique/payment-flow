<div align="center">

# Payment Flow

### Learn Software Engineering by Building a Modern Payment Platform

<p>
A complete educational project that simulates the architecture of modern payment platforms using NestJS, MongoDB, RabbitMQ, GraphQL, Server-Sent Events and Vue.
</p>

---

![Status](https://img.shields.io/badge/status-planning-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Backend](https://img.shields.io/badge/backend-NestJS-red)
![Frontend](https://img.shields.io/badge/frontend-Vue_3-42b883)
![Database](https://img.shields.io/badge/database-MongoDB-47A248)
![Messaging](https://img.shields.io/badge/messaging-RabbitMQ-FF6600)

</div>

---

# 📖 About

**Payment Flow** is an educational project created to teach modern Software Engineering through the development of a payment processing platform.

Instead of focusing on CRUD operations, this repository demonstrates how real engineering teams design scalable, maintainable and event-driven systems.

The application simulates the complete lifecycle of a payment:

- Authentication
- Customer management
- Charge creation
- Payment processing
- Invoice generation
- Event publishing
- Timeline tracking
- Real-time dashboard updates

Every feature exists for a learning purpose.

---

# 🎯 Goals

This project aims to teach:

- Software Architecture
- Backend Engineering
- Event-Driven Architecture
- Modular Monolith
- CQRS (Pragmatic)
- Domain Modeling
- MongoDB Best Practices
- RabbitMQ
- GraphQL
- REST APIs
- Server-Sent Events
- Vue 3
- Docker
- Automated Testing
- Clean Code
- SOLID Principles

---

# 🏛 Architecture

```text
                          Vue Dashboard

                  REST              GraphQL
                     │                 ▲
                     │                 │
                     ▼                 │
              ┌─────────────────────────────┐
              │         NestJS API          │
              └─────────────────────────────┘
                     │
                     │ Domain Events
                     ▼
                 RabbitMQ
                     │
                     ▼
                 Consumers
                     │
                     ▼
                  MongoDB
                     │
                     ▼
         Server-Sent Events (SSE)
                     │
                     ▼
             Vue Query Invalidates Cache
                     │
                     ▼
                 GraphQL Refresh
```

---

# 🧩 Project Structure

```text
payment-flow/

apps/
    api/
    web/

packages/
    shared/
    shared-types/
    eslint-config/
    tsconfig/

docs/
.ai/
docker/

README.md
docker-compose.yml
```

---

# 🛠 Tech Stack

## Backend

- NestJS
- TypeScript
- MongoDB
- Mongoose
- RabbitMQ
- GraphQL
- JWT
- Swagger
- Jest

## Frontend

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Query
- Apollo Client
- TailwindCSS

## DevOps

- Docker
- Docker Compose
- GitHub Actions

---

# 📚 Documentation

| Document | Description |
|----------|-------------|
| Product Vision | Product goals and requirements |
| Architecture | System architecture |
| Domain | Domain modeling |
| Backend | Backend implementation guide |
| Frontend | Frontend implementation guide |
| MongoDB | Database modeling |
| RabbitMQ | Messaging architecture |
| REST | Command API |
| GraphQL | Query API |
| SSE | Real-time communication |
| Dashboard | User interface |
| Testing | Testing strategy |
| ADRs | Architecture Decision Records |

---

# 🧠 Learning Path

The repository was designed to be implemented in incremental phases.

## Phase 1

- Monorepo
- Docker
- NestJS
- Vue
- MongoDB
- Authentication

---

## Phase 2

- Customers
- Charges
- Dashboard

---

## Phase 3

- RabbitMQ
- Domain Events
- Background Workers

---

## Phase 4

- Payment Simulator
- PIX
- Credit Card
- Bank Slip

---

## Phase 5

- GraphQL
- Vue Query
- Server-Sent Events

---

## Phase 6

- Automated Tests
- Documentation
- ADRs

---

# 📖 Repository Philosophy

Every technology must solve a real problem.

Every architectural decision must be documented.

Every feature must have automated tests.

Every module must be independently replaceable.

The focus is not on building another payment gateway.

The focus is learning how professional engineering teams build software.

---

# 📜 License

MIT