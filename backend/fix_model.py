import os

# Point to a brand new clean folder
os.environ["HF_HOME"] = r"C:\Users\POORNA\fresh_hf_cache"
os.environ["TRANSFORMERS_CACHE"] = r"C:\Users\POORNA\fresh_hf_cache"
os.environ["SENTENCE_TRANSFORMERS_HOME"] = r"C:\Users\POORNA\fresh_st_cache"

from sentence_transformers import SentenceTransformer

print("Downloading model to fresh location...")
model = SentenceTransformer("all-MiniLM-L6-v2")
print("Success!")

vec = model.encode(["hello world"])
print("Vector shape:", vec.shape)