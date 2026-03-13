import os
import logging
import chromadb
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Initialize ChromaDB in the uploads directory to persist alongside DB
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
chroma_path = os.path.join(settings.UPLOAD_DIR, "chroma_db")

client = chromadb.PersistentClient(path=chroma_path)

# Single collection for all candidates, filtering by metadata
collection = client.get_or_create_collection(
    name="talentlens_candidates",
    metadata={"hnsw:space": "cosine"}
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=["\n\n", "\n", ".", " ", ""]
)

def index_candidate_cv(candidate_id: str, job_id: str, raw_text: str):
    """
    Chunk and index a candidate's full raw CV text.
    Replaces any existing chunks for the same candidate.
    """
    if not raw_text or not raw_text.strip():
        logger.warning(f"No raw text provided for candidate {candidate_id} to index.")
        return

    try:
        # Delete existing chunks
        collection.delete(where={"candidate_id": candidate_id})
    except Exception:
        pass

    chunks = text_splitter.split_text(raw_text)
    if not chunks:
        return
        
    ids = [f"{candidate_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"candidate_id": candidate_id, "job_id": job_id} for _ in chunks]

    collection.add(
        documents=chunks,
        metadatas=metadatas,
        ids=ids
    )
    logger.info(f"Indexed {len(chunks)} chunks for candidate {candidate_id}")


def search_candidate_cv(candidate_id: str, query: str, top_k: int = 3) -> list[str]:
    """
    Search within a specific candidate's CV for context.
    Returns a list of the top matching string chunks.
    """
    try:
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"candidate_id": candidate_id}
        )
        
        if not results['documents'] or not results['documents'][0]:
            return []
            
        return results['documents'][0]
    except Exception as e:
        logger.error(f"Error querying chroma for candidate {candidate_id}: {e}")
        return []
