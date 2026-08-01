# ai/

Everything here talks to the Anthropic API. Nothing in this folder touches
Express or the frontend directly — it just exports plain async functions that
`backend/routes/*.js` calls. Keeping it isolated means:

- Your API key only ever lives in `backend/.env`, never in the browser.
- You can test/swap the AI logic without touching scheduling or HTTP code.
- If a call fails or the key is missing, every function here fails *quietly*
  (returns null) so the rest of the app keeps working without AI.
