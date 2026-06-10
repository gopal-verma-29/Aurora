# Lead Agent

AI-powered lead shortlister for cold outreach. Finds real businesses, reads their sites, scores them, drafts your pitch.

## Setup (2 minutes)

### 1. Install dependencies
```bash
npm install
```

### 2. Create your .env file
```bash
cp .env.example .env
```
Then open `.env` and paste your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```
Get your key at: https://console.anthropic.com

### 3. Run it
```bash
npm run dev
```
Open http://localhost:3000

---

## How it works

```
Browser → POST /api/leads → Express server → Anthropic API (with web_search tool)
                                           ← JSON leads
Browser ← renders lead cards
```

The API key lives in `.env` on your machine — never in the browser.
This is the same pattern as JWT middleware or DB credential injection.

## Stack
- **Backend**: Node.js + Express + Anthropic SDK
- **Frontend**: Vanilla HTML/CSS/JS (no build step needed)
- **AI**: Claude Haiku 4.5 with web_search tool

## Cost
~$0.01–0.05 per run (5 leads). Claude Haiku is cheap.

## Graduating to n8n
When you're ready to automate, the `/api/leads` logic maps directly to an n8n HTTP Request node.
Same prompt, same API call, just triggered on a schedule instead of a button click.
