# ai-chat-map

3D Chat Map MVP built with Next.js, React Three Fiber, FastAPI, Gemini API, and Neo4j.

## Quick start (Docker)
1) Create env file
```
cp .env.example .env
```
2) Set these values in `.env`
- `NEO4J_PASSWORD`
- `GEMINI_API_KEY`
- Optional: `GEMINI_MODEL`

3) Build and run
```
docker compose up -d --build
```

4) Open
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Neo4j Browser: http://localhost:7474

## Local development
### Backend
```
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000 and calls the backend at
http://localhost:8000 by default.

## Notes
- If Docker builds but the site does not load, make sure containers are running:
  `docker compose up -d` (build alone does not start the services).
