#faiss_store.py
import faiss
import numpy as np
import pickle
import os

class FaissStore:
    """
    FAISS vector store for RAG chatbot.
    Stores embeddings + metadata (source, mongo_id, text).
    """

    def __init__(self, dim: int, index_path: str = "faiss_index.pkl"):
        self.dim = dim
        self.index_path = index_path

        # Load existing index if available
        if os.path.exists(index_path):
            with open(index_path, "rb") as f:
                self.index, self.metadata = pickle.load(f)
            print(f"Loaded FAISS index from {index_path}, {len(self.metadata)} vectors")
        else:
            self.index = faiss.IndexFlatL2(dim)
            self.metadata = []
            print(f"Created new FAISS index with dim={dim}")

    # ─────────────────────────────────────────────────────────────
    def add_vectors(self, vectors: np.ndarray, metadatas: list):
        """
        Add vectors + metadata to FAISS
        """
        if len(vectors) != len(metadatas):
            raise ValueError("Vectors and metadata length mismatch")

        vectors = np.array(vectors).astype("float32")

        if vectors.shape[1] != self.dim:
            raise ValueError(f"Vector dimension mismatch. Expected {self.dim}")

        self.index.add(vectors)
        self.metadata.extend(metadatas)

        self._save_index()
        print(f"Added {len(vectors)} vectors. Total = {len(self.metadata)}")

    # ─────────────────────────────────────────────────────────────
    def search(self, query_vector: np.ndarray, top_k: int = 5):
        """
        Safe FAISS search
        """
        # ✅ If no data in FAISS
        if self.index.ntotal == 0:
            print("⚠️ FAISS index is empty")
            return []

        # Ensure correct shape
        if len(query_vector.shape) == 1:
            query_vector = np.expand_dims(query_vector, axis=0)

        query_vector = query_vector.astype("float32")

        # Ensure top_k does not exceed available vectors
        top_k = min(top_k, self.index.ntotal)

        D, I = self.index.search(query_vector, top_k)

        results = []
        for idx in I[0]:
            # ✅ Safety check
            if idx < len(self.metadata):
                results.append(self.metadata[idx])

        return results

    # ─────────────────────────────────────────────────────────────
    def _save_index(self):
        with open(self.index_path, "wb") as f:
            pickle.dump((self.index, self.metadata), f)

    # ─────────────────────────────────────────────────────────────
    def get_count(self):
        """
        Debug helper
        """
        return self.index.ntotal