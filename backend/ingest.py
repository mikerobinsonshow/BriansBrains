from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb

DOCS = Path(__file__).resolve().parents[1] / "docs"
DB_DIR = str(Path(__file__).resolve().parent / "chroma_db")


def load_docs():
    items = []
    for p in DOCS.rglob("*"):
        if p.suffix.lower() == ".pdf":
            items += PyPDFLoader(str(p)).load()
        elif p.suffix.lower() in {".txt", ".md"}:
            items += TextLoader(str(p), encoding="utf-8").load()
    return items


def main():
    raw = load_docs()
    splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=150)
    chunks = splitter.split_documents(raw)
    enc = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    embs = enc.encode([c.page_content for c in chunks], normalize_embeddings=True)

    client = chromadb.PersistentClient(path=DB_DIR)
    col = client.get_or_create_collection("kb")
    metas = []
    for c in chunks:
        meta = {}
        src = c.metadata.get("source") or c.metadata.get("file_path")
        if src:
            meta["source"] = str(src)
        page = c.metadata.get("page")
        if page is not None:
            try:
                meta["page"] = int(page)
            except (TypeError, ValueError):
                pass
        metas.append(meta)

    col.add(
        ids=[f"id-{i}" for i in range(len(chunks))],
        documents=[c.page_content for c in chunks],
        metadatas=metas,
        embeddings=embs.tolist(),
    )
    print(f"Indexed {len(chunks)} chunks.")


if __name__ == "__main__":
    main()
