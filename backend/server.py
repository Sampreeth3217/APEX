import asyncio, atexit, os, shutil, subprocess, sys
from pathlib import Path
import httpx
from dotenv import dotenv_values
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.background import BackgroundTask

# Thin launcher only: the whole API is the Node.js (Express) app in ./src.
# Supervisor runs uvicorn on 8001, so this file starts Node and forwards traffic to it unchanged.
ROOT = Path(__file__).parent
NODE_PORT = "8002"
env = {**os.environ, **{k: v for k, v in dotenv_values(ROOT / ".env").items() if v is not None}, "PORT": NODE_PORT}

if not (ROOT / "node_modules").exists() and shutil.which("yarn"):
    subprocess.run(["yarn", "install", "--frozen-lockfile"], cwd=ROOT, check=False)

subprocess.run(["pkill", "-f", "node --watch src/index.js"], check=False)
node = subprocess.Popen(["node", "--watch", "src/index.js"], cwd=ROOT, env=env, stdout=sys.stdout, stderr=sys.stderr)
atexit.register(node.terminate)

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
client = httpx.AsyncClient(base_url=f"http://127.0.0.1:{NODE_PORT}", timeout=httpx.Timeout(120.0, connect=5.0))
HOP = {"connection", "keep-alive", "transfer-encoding", "te", "trailer", "upgrade", "content-length"}


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy(path: str, request: Request):
    headers = {k: v for k, v in request.headers.items() if k.lower() not in HOP}
    headers["x-forwarded-host"] = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    headers["accept-encoding"] = "identity"
    body = await request.body()
    resp = None
    for _ in range(40):
        try:
            req = client.build_request(request.method, f"/{path}", params=request.query_params, headers=headers, content=body)
            resp = await client.send(req, stream=True)
            break
        except httpx.ConnectError:
            await asyncio.sleep(0.25)
    if resp is None:
        return JSONResponse({"error": "Service is starting, please retry."}, status_code=503)
    out = StreamingResponse(resp.aiter_raw(), status_code=resp.status_code, background=BackgroundTask(resp.aclose))
    out.raw_headers = [(k.encode("latin-1"), v.encode("latin-1")) for k, v in resp.headers.multi_items() if k.lower() not in HOP]
    return out
