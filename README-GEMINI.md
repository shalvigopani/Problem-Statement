# LearnAI — Gemini Flash setup

This version automatically reads a local `.env` file from the same folder as `server.py`. The Gemini API key stays server-side and is never placed in frontend JavaScript.

## 1. Create `.env`

Copy `.env.example` to `.env` and put your own key in it:

```env
GEMINI_API_KEY=YOUR_KEY
GEMINI_MODEL=gemini-3.8-flash
PORT=8000
```

Do not share or commit the real `.env` file.

## 2. Install dependency

```bash
pip install -r requirements.txt
```

## 3. Start LearnAI

```bash
python server.py
```

You should see:

```text
LearnAI running at http://localhost:8000
Gemini model: gemini-3.8-flash
Gemini API: configured
```

If it still says `NOT configured`, check that the file is named exactly `.env` and is in the same `LearnAI-Frontend` folder as `server.py`.

## 4. Open the app

Open `http://localhost:8000` in Chrome. Do not double-click the HTML files when using Gemini; use the local server URL.

## 5. How Gemini is used

- **Generate Assessment:** sends the uploaded material plus assessment name, question count, difficulty, focus, and additional requirements to Gemini Flash.
- **Learn Topic:** sends the uploaded material and selected topic for a grounded explanation.
- The browser calls `/api/...` routes; the API key remains only on the Python server.
- If Gemini is unavailable, the current frontend has a material-grounded local fallback so the rest of the project remains usable.

The default model is `gemini-3.8-flash`.
