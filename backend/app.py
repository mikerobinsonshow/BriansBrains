from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import chromadb
import httpx
import json

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = chromadb.PersistentClient(path="backend/chroma_db")
col = client.get_or_create_collection("kb")
embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

SYSTEM = (
    "You are a helpful assistant. Use ONLY the context to answer."
    " If not present, say you don't know from our docs. Cite as [S1]...[S4]."
)


class ChatReq(BaseModel):
    message: str


def prompt_for(q: str, hits):
    ctx = []
    cite_map = []
    for i, (doc, meta) in enumerate(hits, 1):
        ctx.append(f"[S{i}] {doc}")
        src = meta.get("source", "")
        page = meta.get("page")
        cite_map.append(f"S{i}: {src}{f' p.{page}' if page is not None else ''}")
    p = (
        f"{SYSTEM}\n\nCONTEXT:\n"
        + "\n\n".join(ctx)
        + f"\n\nUSER: {q}\nASSISTANT:"
    )
    return p, cite_map


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat")
async def chat(req: ChatReq):
    q_emb = embedder.encode([req.message], normalize_embeddings=True).tolist()[0]
    r = col.query(
        query_embeddings=[q_emb], n_results=4, include=["documents", "metadatas"]
    )
    if not r["documents"] or not r["documents"][0]:
        return {"text": "I don't know from our docs.", "citations": []}
    hits = list(zip(r["documents"][0], r["metadatas"][0]))
    prompt, cites = prompt_for(req.message, hits)

    async with httpx.AsyncClient(timeout=None) as s:
        stream = s.stream(
            "POST",
            "http://localhost:11434/api/generate",
            json={
                "model": "phi3.5:3.8b",
                "prompt": prompt,
                "stream": True,
                "options": {"num_ctx": 4096, "num_predict": 256, "temperature": 0.2},
            },
        )
        text = ""
        async with stream as resp:
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    text += obj.get("response", "")
                except Exception:
                    pass
    return {"text": text.strip(), "citations": cites}
