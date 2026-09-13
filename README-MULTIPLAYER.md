# LearnAI Multiplayer Quiz Battle

## What was added
- Real-time Create Room / Join Room using Socket.IO
- Unique 6-digit room codes
- Waiting lobby with live player updates
- Host-generated shared Gemini quiz
- Same questions and timer for every player
- Server-side scoring and live leaderboard
- Final rank, score, accuracy, time taken and group performance
- AI feedback through the existing Python Gemini API
- Optional MongoDB persistence

## Run locally
1. Keep the existing Python backend running:
   `python server.py`
2. In another terminal, install Node dependencies:
   `npm install`
3. Start multiplayer backend:
   `npm start`
4. Open:
   `http://localhost:3000/multiplayer.html`

For another device on the same Wi-Fi, open the computer's LAN IP on port 3000, e.g. `http://192.168.x.x:3000/multiplayer.html`.

For internet multiplayer, deploy the Node server to a reachable HTTPS host and set `LEARNAI_API_URL` to the reachable Python API. Set `MONGODB_URI` if persistent room records are desired.
