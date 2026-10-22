# AI Employee

AI Employee is a React + TypeScript workspace for delegating everyday knowledge-work to an AI agent.

The project is intentionally built around an **employee workflow**, not just a chatbot: give the agent work, see what it is doing, track the queue, and keep human approval for actions that should not happen automatically.

## What works now

- 🔐 Polished sign-in screen with a ready-to-use demo workspace
- ✦ AI Employee command box for delegating new work
- 📋 Persistent-style task workflow with queued, in-progress, and completed states
- 📊 Daily progress and workload overview
- ⚡ Live agent activity feed
- 👀 Human approval queue for actions that need review
- 💾 Session persistence across page refreshes
- 📱 Responsive desktop/tablet/mobile layout
- 🔌 Existing API layer remains available for connecting a real AI/backend service

## Demo

Use the **Try demo workspace** button on the login page, or use:

- Email: `demo@aiemployee.local`
- Password: `employee123`

The demo runs the employee workspace without requiring a backend login service.

## Run locally

```bash
npm install
npm run dev
```

For the existing API-backed login, configure `VITE_API_URL` in your local environment.

## Product direction

The next layer is to replace the local task simulation with an agent backend that can safely use tools such as email, calendar, documents, web research, GitHub, and internal APIs. Each tool action should be logged and sensitive actions should pass through the approval queue.
