import chromadb

client = chromadb.PersistentClient(path="backend/chroma_db")
col = client.get_or_create_collection("knowledgebase")

print("Total chunks:", col.count())

# Peek at some docs
res = col.get(include=["metadatas"], limit=10)
for meta in res["metadatas"]:
    print(meta.get("source"), meta.get("page"))
