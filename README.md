# LocalTongue

[![Go](https://img.shields.io/badge/Go-1.24-00ADD8?style=flat&logo=go&logoColor=white)](https://golang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![License: MIT + Commons Clause](https://img.shields.io/badge/License-MIT%20+%20Commons%20Clause-blue.svg)](./LICENSE)

**LocalTongue** is a local-first language learning tool I built for personal use. The idea came from a simple observation: enterprise LLMs like GPT-4o or Claude are excellent conversational partners for language practice, but using them at the frequency that effective language learning requires gets expensive quickly. Running a capable open-weight model locally through [LM Studio](https://lmstudio.ai) removes that constraint entirely — unlimited conversation practice at zero marginal cost.

The tool lets you have real-time voice conversations with an AI tutor in 13 languages, across 6 CEFR proficiency levels and 14 topic areas. Every session is persisted, resumable, and can be turned into a generated quiz to reinforce what you practised.

---

## Features

- **Real-time voice conversation** — speak directly to the AI tutor using your microphone; responses are read back via text-to-speech
- **13 supported languages** — English, Italian, Spanish, French, German, Portuguese, Japanese, Mandarin, Korean, Russian, Arabic, Dutch, Polish
- **6 CEFR proficiency levels** — A1 through C2, each with an adapted system prompt that adjusts vocabulary complexity and error correction style
- **14 conversation topics** — Daily Life, Travel, Food & Cooking, Business, Technology, History, and more
- **Durable session history** — every conversation is persisted in MongoDB and can be resumed at any point from where it was left off
- **AI-generated quizzes** — generate a 5-question multiple-choice quiz from any session transcript to test vocabulary, grammar, and expressions
- **Smart voice selection** — automatic TTS voice scoring (on-device, premium, neural, enhanced) with a manual override selector and live search
- **Language auto-detection** — the TTS language is inferred from the LLM response text, improving STT accuracy on the next recording pass
- **Paginated history** — filterable by language for both sessions and quizzes

---

## Prerequisites

The only things you need installed on your machine are:

| Dependency | Version | Purpose |
|---|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 4.x+ | Runs all services (MongoDB, backend, frontend) |
| [LM Studio](https://lmstudio.ai) | any | Local LLM inference — must run on the host machine |

Go, Node.js, and all other dependencies are handled entirely inside Docker containers. Nothing else needs to be installed.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/local_tongue.git
cd local_tongue
```

### 2. Configure LM Studio

1. Open LM Studio and download any instruction-following model (recommended: `Llama 3.1 8B Instruct`, `Mistral 7B Instruct`, or `Phi-4`)
2. Go to the **Local Server** tab
3. Load the model and start the server — it must be listening on `http://127.0.0.1:1234`
4. Ensure the server is running before proceeding

> The backend calls the OpenAI-compatible `/v1/chat/completions` endpoint. Any model that supports this interface will work.

### 3. Start everything

```bash
docker compose up --build
```

Docker will:
1. Pull the MongoDB 7 image and start it (waiting for the healthcheck to pass)
2. Build the Go backend image, install all modules, compile, and start the binary
3. Build the Node.js image, install all npm packages, build the static assets, and serve them via nginx

No manual install step is required. All dependencies are resolved inside their respective containers.

| Service | Address |
|---|---|
| Frontend | http://localhost:5173 |
| REST API | http://localhost:3000 |
| WebSocket | ws://localhost:3001 |
| MongoDB | mongodb://localhost:27017 |
| LM Studio | http://127.0.0.1:1234 (on host) |

Press `Ctrl+C` to stop all services.

### 4. Other useful commands

```bash
docker compose down                  # Stop and remove all containers
docker compose build --no-cache      # Rebuild all images from scratch
docker compose logs -f               # Tail logs from all services
```

---

## Architecture Overview

LocalTongue is split into two independently running processes — a REST API and a WebSocket server — backed by a shared MongoDB instance and a local LM Studio inference endpoint.

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React + Vite)                  │
│                                                             │
│  ┌──────────────────┐         ┌───────────────────────────┐ │
│  │  TanStack Query  │◄──────► │   WebSocket Service       │ │
│  │  (server state)  │  HTTP   │   (singleton, port 3001)  │ │
│  └──────────────────┘         └───────────────────────────┘ │
│           │                               │                 │
│  ┌────────▼───────────────────────────────▼──────────────┐  │
│  │              Zustand Stores                           │  │
│  │  useSessionStore · useWebSocketStore · useVoiceStore  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────┬──────────────────────────┬────────────────────┘
              │ REST (port 3000)          │ WS (port 3001)
              ▼                          ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│   Go REST Server    │    │      Go WebSocket Server        │
│                     │    │                                 │
│  session handler    │    │  - upgrades HTTP → WS           │
│  quiz handler       │    │  - rebuilds history from DB     │
│                     │    │  - streams user msg to LLM      │
│  service layer      │    │  - persists messages to DB      │
│  repository layer   │    │  - sends agent_response back    │
└────────┬────────────┘    └───────────────┬─────────────────┘
         │                                 │
         └──────────────┬──────────────────┘
                        │
              ┌─────────▼──────────┐       ┌────────────────────┐
              │     MongoDB 7      │       │    LM Studio       │
              │  db: localtongue   │       │  /v1/chat/         │
              │                    │       │  completions       │
              │  collections:      │       │  port 1234         │
              │  · sessions        │       └────────────────────┘
              │  · messages        │
              │  · quizzes         │
              └────────────────────┘
```

---

## Technical Deep Dive

### Backend — Go

The backend is written in idiomatic Go with no web framework — only the standard library `net/http` mux (Go 1.22+, which supports method + path pattern routing), `gorilla/websocket`, and the official MongoDB driver.

#### Domain structure

Each domain follows a strict three-layer architecture:

```
server/
├── session/
│   ├── Handler.go       # HTTP handler — thin, no business logic
│   ├── Service.go       # Business logic
│   ├── Repository.go    # MongoDB implementation
│   ├── Interfaces.go    # Repository and Service interfaces
│   └── Types.go         # Domain structs, DTOs, request/response types
├── message/             # No handler, no service — pure data access layer
│   ├── Repository.go
│   ├── Interfaces.go
│   └── Types.go
├── quiz/                # Same structure as session
├── websocket/
│   └── Handler.go       # Full real-time conversation logic
├── lmstudio/
│   ├── Service.go       # HTTP client for LM Studio
│   ├── PromptBuilder.go # Dynamic system prompt construction
│   └── Types.go
└── database/
    └── Mongo.go         # Singleton MongoDB client bootstrap
```

#### Repository pattern

All data access is abstracted behind interfaces defined in `Interfaces.go`. Handlers and services never touch the MongoDB driver directly — they only work with the interface. This keeps the business logic testable and the data layer swappable.

```go
// session/Interfaces.go
type Repository interface {
    Create(ctx context.Context, s *Session) error
    FindPaginated(ctx context.Context, filter SessionFilter, page, limit int) ([]Session, int64, error)
    FindDistinctLanguages(ctx context.Context) ([]LanguageOption, error)
    FindByID(ctx context.Context, id primitive.ObjectID) (*Session, error)
    Delete(ctx context.Context, id primitive.ObjectID) error
    DeleteAll(ctx context.Context) error
    IncrementMessageCount(ctx context.Context, id primitive.ObjectID) error
}
```

#### Two-server design

The REST and WebSocket servers run as separate `http.ServeMux` instances on different ports. This is intentional: WebSocket connections are long-lived and stateful, while REST calls are short-lived and stateless. Keeping them separated avoids routing ambiguity and allows them to scale independently.

```go
// REST on :3000 runs in a goroutine
go func() {
    http.ListenAndServe(":3000", withCORS(mux))
}()

// WebSocket on :3001 blocks the main goroutine
http.ListenAndServe(":3001", wsMux)
```

#### WebSocket conversation lifecycle

The WebSocket handler (`websocket/Handler.go`) manages the full conversation lifecycle for each connection:

1. **Upgrade** — HTTP connection is upgraded via `gorilla/websocket`
2. **Init phase** — waits for an `init_session` message containing the session ID
3. **History rebuild** — loads all prior messages from MongoDB and reconstructs the `[]lmstudio.ChatMessage` slice, making every conversation resumable without any client-side state
4. **Message loop** — for each `user_message`:
   - Calls `lmstudio.Complete` with the full history + new message
   - Persists both the user message and the LLM response to MongoDB
   - Atomically increments `messageCount` on the session document
   - Appends both to the in-memory history slice
   - Sends `agent_response` back over the WebSocket

The wire protocol uses typed JSON envelopes: `{ "type": string, "payload": any }`.

#### Dynamic system prompt

The `lmstudio.BuildSystemPrompt` function constructs a multi-section prompt at runtime from the session's `Language`, `Level`, and `Topic`. The CEFR level section adapts the LLM's behaviour explicitly:

- **A1/A2** — simple vocabulary, short sentences, patient and encouraging tone
- **B1/B2** — everyday language, occasional idioms, brief inline corrections
- **C1/C2** — natural varied speech with colloquialisms, only major errors corrected

#### Quiz generation pipeline

The `quiz.Service.Generate` method implements a transcript-to-quiz pipeline:

1. Fetches all messages for the given session IDs and builds a formatted transcript string
2. Constructs a structured prompt requesting exactly 5 MCQ questions with a strict JSON schema
3. Calls `lmstudio.CompleteRaw` with a low temperature (`0.3`) for deterministic output and a system prompt that instructs the model to respond with raw JSON only
4. Unmarshals the response into `[]QuizQuestion` and validates that at least one question was returned
5. Persists the quiz document and returns the DTO

---

### Frontend — React + TypeScript

The frontend is built with React 19, TypeScript, Vite, TanStack Query v5 for server state, Zustand v5 for UI state, and shadcn/ui + Tailwind CSS v4 for the component layer.

#### State architecture

State is divided into two clear categories with no overlap:

| Layer | Tool | Responsibility |
|---|---|---|
| Server state | TanStack Query | API data, loading/error states, cache invalidation |
| UI / ephemeral state | Zustand | Active session, WebSocket status, voice machine state, quiz progress |

Three domain stores keep UI state isolated:
- `useSessionStore` — the currently active session and its readiness flag
- `useWebSocketStore` — connection status and accumulated incoming messages
- `useVoiceStore` — voice state machine (`idle → listening → processing → speaking`), interim transcript, preferred TTS voice

#### WebSocket singleton pattern

The WebSocket connection is managed as a class-based singleton (`services/websocket/index.ts`) and initialised once in `App.tsx`. It writes imperatively into the Zustand store via `getState()` rather than through React state, which means UI updates propagate reactively without the service needing to know anything about the component tree.

Components never import the service directly — they access WebSocket state exclusively through the `useWebSocket` hook, which is a thin adapter over `useWebSocketStore`.

```
WebSocketService (class singleton)
        │
        │ writes via getState()
        ▼
useWebSocketStore (Zustand)
        │
        │ consumed via
        ▼
useWebSocket (hook) ──► Components
```

#### Voice pipeline

The voice interaction is split across two hooks with a shared state machine:

**`useVoiceInput`** wraps the Web Speech Recognition API:
- `continuous: true` with `interimResults: true` for live transcript display
- Seeds `SpeechRecognition.lang` from `conversationLanguage` in the voice store, improving STT accuracy across turns
- 5-second silence debounce via a ref-based timer — auto-submits the transcript after the user stops speaking
- On final transcript: transitions to `processing`, calls the WebSocket send callback

**`useSpeechOutput`** wraps the Web Speech Synthesis API:
- Resolves the best available voice using `voiceSelector.ts` scoring rubric (on-device +20, premium +20, enhanced/neural +15, compact −20)
- Cancels in-flight utterances before starting new ones; defers `speak()` by 50ms to avoid a Chrome bug where immediate `cancel()` + `speak()` silently drops the utterance
- Stores the resolved BCP-47 language tag back into `conversationLanguage` after each response, closing the feedback loop for STT

**`useAgentSpeech`** is the top-level orchestrator mounted once in `App.tsx`. It watches the WebSocket message queue and routes `agent_response` messages to TTS, `error` messages to toast notifications, and `session_ready` messages to the session store.

#### Language auto-detection

`lib/languageDetector.ts` implements a client-side language detector used to pick the correct TTS voice for agent responses:

1. Non-Latin Unicode range checks (Kana, Hangul, Cyrillic, Arabic, Hebrew, Greek, Thai, Devanagari, CJK)
2. Distinctive punctuation patterns (`¿`/`¡` → Spanish)
3. Stopword frequency scoring across 10 Latin-script languages

#### API layer conventions

All HTTP calls follow the same pattern:
- Each operation has its own hook file in `src/api/{domain}/`
- Hooks are named `use` + verb + resource (e.g. `useGetSessions`, `useCreateSession`, `useDeleteQuiz`)
- All hooks use TanStack Query with explicit `queryKey` arrays for precise cache invalidation
- Mutations have `onError` callbacks that fire human-readable `toast.error()` messages via Sonner
- No API call is ever made directly from a component

#### Routing

```
/               Home — session setup form or active conversation view
/sessions       Paginated session history, filterable by language
/sessions/:id   Session detail with full message history and quiz generation trigger
/quiz           Paginated quiz list, filterable by language
/quiz/:id       Interactive quiz with per-question feedback and final results view
```

---

## Project Structure

```
local_tongue/
├── client/                        # React + Vite frontend
│   └── src/
│       ├── api/                   # TanStack Query hooks, one file per operation
│       │   ├── session/
│       │   └── quiz/
│       ├── components/            # Shared UI components (PascalCase folders)
│       │   ├── SessionSetup/
│       │   ├── ConversationView/
│       │   ├── VoiceButton/
│       │   ├── VoiceSelector/
│       │   ├── AgentTranscript/
│       │   ├── ConfirmDeleteDialog/
│       │   ├── Pagination/
│       │   └── ui/                # shadcn/ui primitives
│       ├── hooks/                 # Stateful non-API hooks
│       │   ├── useAgentSpeech.ts
│       │   ├── useSpeechOutput.ts
│       │   ├── useVoiceInput.ts
│       │   └── useWebSocket.ts
│       ├── lib/
│       │   ├── constants.ts       # SUPPORTED_LANGUAGES, LANGUAGE_LEVELS, CONVERSATION_TOPICS
│       │   ├── helpers.ts
│       │   ├── languageDetector.ts
│       │   ├── voiceSelector.ts
│       │   └── utils.ts           # cn() utility
│       ├── pages/                 # Route-level components
│       │   ├── Home/
│       │   ├── Sessions/
│       │   ├── SessionDetail/
│       │   ├── Quiz/
│       │   └── QuizDetail/
│       ├── services/
│       │   └── websocket/         # WebSocket singleton service
│       ├── stores/                # Zustand stores
│       │   ├── session/
│       │   ├── websocket/
│       │   ├── voice/
│       │   └── quiz/
│       └── types/
│           └── index.ts           # Shared TypeScript interfaces
│
├── server/                        # Go backend
│   ├── database/                  # MongoDB singleton bootstrap
│   ├── lmstudio/                  # LM Studio HTTP client + prompt builder
│   ├── message/                   # Message repository (no handler/service)
│   ├── session/                   # Session handler, service, repository
│   ├── quiz/                      # Quiz handler, service, repository
│   ├── websocket/                 # Real-time conversation handler
│   └── main.go                    # Server wiring and startup
│
├── docker-compose.yml             # MongoDB 7 container
├── Makefile                       # Dev orchestration commands
└── README.md
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| Language | TypeScript 5 |
| Server state | TanStack Query v5 |
| UI state | Zustand v5 |
| HTTP client | Axios |
| UI components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Toast notifications | Sonner |
| Backend language | Go 1.24 |
| HTTP routing | stdlib `net/http` (Go 1.22+ patterns) |
| WebSocket | gorilla/websocket |
| Database | MongoDB 7 (via official Go driver) |
| LLM inference | LM Studio (OpenAI-compatible API) |
| Containerisation | Docker Compose |

---

## License

Copyright (c) 2025 **Francesco Squitieri**. All rights reserved.

This project is licensed under the **MIT License + Commons Clause**.

You are free to use, study, modify, and distribute this software for any non-commercial purpose. The Commons Clause condition prohibits selling the software or offering it as a paid hosted service (e.g. SaaS) without explicit written permission from the author.

See [LICENSE](./LICENSE) for full details.
