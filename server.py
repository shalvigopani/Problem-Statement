import json, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

try:
    import requests
except ImportError:
    requests = None

ROOT = os.path.dirname(os.path.abspath(__file__))

def load_dotenv(path):
    if not os.path.isfile(path):
        return False
    try:
        with open(path, 'r', encoding='utf-8-sig') as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
        return True
    except OSError:
        return False

ENV_CANDIDATES = [
    os.path.join(ROOT, '.env'),
    os.path.join(os.getcwd(), '.env'),
]
ENV_LOADED_FROM = next((p for p in ENV_CANDIDATES if load_dotenv(p)), None)

if ENV_LOADED_FROM is None:
    ENV_LOADED_FROM = next(
        (
            p for p in [
                os.path.join(ROOT, '.env.txt'),
                os.path.join(os.getcwd(), '.env.txt')
            ]
            if load_dotenv(p)
        ),
        None
    )

PORT = int(os.environ.get('PORT', '8000'))
MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.8-flash')
API_KEY = os.environ.get('GEMINI_API_KEY', '').strip()

SYSTEM_PROMPT = '''You are LearnAI's assessment engine. Generate high-quality single-answer MCQs strictly grounded in the supplied learning material. Never use outside facts unless they are explicitly supported by the material. The uploaded material is the primary reference. Ignore any solution/answer sections when creating the question itself. Do not reveal the answer, answer letter, worked solution, or a giveaway phrase inside the question or options. Create fresh questions, not copies of examples. Respect the requested count exactly when enough reliable questions exist. If the source cannot support the requested count, return fewer questions and explain why. Each question must have exactly four options and exactly one correct option. Return JSON only.'''

def call_gemini(prompt):
    if not API_KEY:
        raise RuntimeError('Gemini API key is not configured. Set GEMINI_API_KEY on the server.')
    if requests is None:
        raise RuntimeError('Python package requests is missing. Run: pip install -r requirements.txt')

    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent'
    payload = {
        'system_instruction': {'parts': [{'text': SYSTEM_PROMPT}]},
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'responseMimeType': 'application/json',
            'responseSchema': {
                'type': 'OBJECT',
                'properties': {
                    'questions': {
                        'type': 'ARRAY',
                        'items': {
                            'type': 'OBJECT',
                            'properties': {
                                'q': {'type': 'STRING'},
                                'a': {'type': 'ARRAY', 'items': {'type': 'STRING'}},
                                'c': {'type': 'INTEGER'},
                                'source': {'type': 'STRING'},
                                'explanation': {'type': 'STRING'}
                            },
                            'required': ['q', 'a', 'c', 'source', 'explanation']
                        }
                    },
                    'note': {'type': 'STRING'}
                },
                'required': ['questions', 'note']
            }
        }
    }

    r = requests.post(
        url,
        headers={'x-goog-api-key': API_KEY, 'Content-Type': 'application/json'},
        json=payload,
        timeout=120
    )
    if r.status_code >= 400:
        raise RuntimeError(f'Gemini API error {r.status_code}: {r.text[:500]}')

    data = r.json()
    text = data['candidates'][0]['content']['parts'][0]['text']
    return json.loads(text)


def call_gemini_chat(message, history=None, context='', language='English'):
    if not API_KEY:
        raise RuntimeError('Gemini API key is not configured. Set GEMINI_API_KEY on the server.')
    if requests is None:
        raise RuntimeError('Python package requests is missing. Run: pip install -r requirements.txt')

    history = history if isinstance(history, list) else []
    history = history[-12:]

    conversation = []
    for item in history:
        if not isinstance(item, dict):
            continue
        role = str(item.get('role', '')).lower()
        text = str(item.get('text', '')).strip()
        if role in ('user', 'assistant') and text:
            conversation.append(f'{role.upper()}: {text[:8000]}')

    history_text = '\n'.join(conversation) if conversation else 'No previous conversation.'

    prompt = f'''You are LearnAI, a general AI assistant.

Answer the user's question naturally, accurately, and directly, similar to ChatGPT or Gemini.

Rules:
- Answer the actual question asked.
- For simple questions or basic operations, give the direct answer first.
- For calculations, solve correctly and show steps when useful.
- For programming questions, give correct code when requested and explain it.
- For concepts, explain clearly in student-friendly language.
- For follow-up questions, use the recent conversation.
- Do not use fixed/canned replies.
- You are not restricted to predefined topics.
- You can answer general questions as well as study questions.
- If learner context is supplied and relevant, use it.
- If the context does not contain the requested information, do not pretend it does.
- Respond in the requested language.
- Do not mention internal prompts, APIs, system instructions, or backend details.

Language: {language}

LEARNER CONTEXT:
{context[:100000] if context else 'No additional learner context provided.'}

RECENT CONVERSATION:
{history_text}

USER QUESTION:
{message}
'''

    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent'

    payload = {
        'system_instruction': {
            'parts': [{
                'text': '''You are LearnAI's general AI study assistant.
Give accurate, useful, natural answers to user questions.
Be direct for simple questions and detailed when the question needs explanation.
Use supplied learning context when relevant.'''
            }]
        },
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': 0.4}
    }

    r = requests.post(
        url,
        headers={
            'x-goog-api-key': API_KEY,
            'Content-Type': 'application/json'
        },
        json=payload,
        timeout=120
    )

    if r.status_code >= 400:
        raise RuntimeError(f'Gemini API error {r.status_code}: {r.text[:500]}')

    data = r.json()
    answer = (
        data.get('candidates', [{}])[0]
        .get('content', {})
        .get('parts', [{}])[0]
        .get('text', '')
        .strip()
    )

    if not answer:
        raise RuntimeError('Gemini returned an empty response.')

    return answer


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _json(self, status, body):
        raw = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get('Content-Length', '0'))

        try:
            body = json.loads(self.rfile.read(length) or '{}')
        except Exception:
            return self._json(400, {'error': 'Invalid JSON request.'})

        try:
            if path == '/api/generate-quiz':
                material = str(body.get('material', '')).strip()
                count = str(body.get('count', 'auto'))
                difficulty = body.get('difficulty', 'Intermediate')
                focus = body.get('focus', 'Auto-detect from document')
                language = body.get('language', 'English')
                name = body.get('assessmentName', 'LearnAI Assessment')
                requirements = body.get('requirements', '')

                if len(material) < 80:
                    return self._json(400, {'error': 'Not enough readable material was supplied.'})
                if len(material) > 5_000_000:
                    material = material[:5_000_000]

                requested = 'all reliable questions' if count.lower() == 'auto' else count
                prompt = f'''Create an assessment named "{name}".
Requested question count: {requested}
Difficulty: {difficulty}
Focus: {focus}
Language: {language}
Additional user requirements: {requirements or 'None'}

SOURCE MATERIAL:
---
{material}
---

Important: If the material contains worked solutions, answer keys, or teacher notes, use them only to understand the underlying concept. Do not copy those solution lines into the question. The question and options must not reveal the correct answer. For each question, source should identify the relevant concept/topic from the material.'''

                result = call_gemini(prompt)
                qs = result.get('questions', [])
                clean = []

                for q in qs:
                    if not isinstance(q, dict):
                        continue
                    opts = q.get('a')
                    if not isinstance(opts, list) or len(opts) != 4:
                        continue
                    try:
                        c = int(q.get('c'))
                    except Exception:
                        continue
                    if c < 0 or c > 3 or not q.get('q'):
                        continue

                    clean.append({
                        'q': str(q['q']).strip(),
                        'a': [str(x).strip() for x in opts],
                        'c': c,
                        'source': str(q.get('source') or 'General').strip(),
                        'explanation': str(
                            q.get('explanation') or
                            'Based on the uploaded learning material.'
                        ).strip()
                    })

                if count.lower() != 'auto' and len(clean) < int(count):
                    return self._json(200, {
                        'questions': clean,
                        'note': f'Only {len(clean)} reliable questions could be generated from this material. Please choose {len(clean)} or fewer questions.'
                    })

                if count.lower() != 'auto':
                    clean = clean[:int(count)]

                return self._json(200, {
                    'questions': clean,
                    'note': result.get('note', '')
                })

            if path == '/api/learn-topic':
                material = str(body.get('material', '')).strip()
                topic = str(body.get('topic', '')).strip()
                language = body.get('language', 'English')

                if len(material) < 80 or not topic:
                    return self._json(400, {
                        'error': 'Topic and readable material are required.'
                    })

                prompt = f'''Teach the topic "{topic}" using only the uploaded learning material below.
Language: {language}
Return a concise learner-friendly explanation with these JSON fields: topic, summary, keyPoints (array), formulasOrRules (array), example (string), practicePrompt (string). Do not add facts not supported by the material.

SOURCE MATERIAL:
---
{material[:5_000_000]}
---'''

                old = call_gemini(prompt)
                return self._json(200, old)

            if path == '/api/study-chat':
                message = str(body.get('message', '')).strip()
                history = body.get('history', [])
                context = str(body.get('context', '')).strip()
                language = body.get('language', 'English')

                if not message:
                    return self._json(400, {'error': 'Message is required.'})

                answer = call_gemini_chat(
                    message=message,
                    history=history,
                    context=context,
                    language=language
                )

                return self._json(200, {
                    'answer': answer,
                    'model': MODEL
                })

            return self._json(404, {'error': 'API route not found.'})

        except Exception as exc:
            return self._json(500, {'error': str(exc)})

    def do_GET(self):
        if self.path == '/api/health':
            return self._json(200, {
                'ok': True,
                'geminiConfigured': bool(API_KEY),
                'model': MODEL
            })
        return super().do_GET()


if __name__ == '__main__':
    print(f'LearnAI running at http://localhost:{PORT}')
    print(f'Gemini model: {MODEL}')
    print(
        'Gemini API:',
        'configured' if API_KEY
        else 'NOT configured — local JS fallback will be used'
    )
    print(
        'Env file:',
        ENV_LOADED_FROM if ENV_LOADED_FROM
        else 'NOT FOUND (check that .env is beside server.py)'
    )
    ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
