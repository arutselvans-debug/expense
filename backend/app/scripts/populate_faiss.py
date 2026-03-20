# app/scripts/populate_faiss.py

import pandas as pd
from sentence_transformers import SentenceTransformer
from app.vector_store.faiss_store import FaissStore
from app.database.mongodb import fetch_all_expenses
import kagglehub
import os

# ── CATEGORY ALIASES ─────────────────────────────────────
category_aliases = {
    "Groceries": ["groceries", "food", "supermarket", "snacks", "meal"],
    "Transport": ["transport", "bus", "cab", "uber", "fuel"],
    "Bills": ["electricity", "wifi", "internet", "mobile", "recharge"],
    "Rent": ["rent", "house", "pg", "hostel"],
    "Fees": ["fees", "tuition", "education"],
    "Entertainment": ["movies", "netflix", "gaming"],
    "Dining": ["restaurant", "cafe", "zomato", "swiggy"]
}

# ── NORMALIZE FUNCTION ───────────────────────────────────
def normalize_text(text: str) -> str:
    text_lower = text.lower()

    for main_cat, aliases in category_aliases.items():
        for word in aliases:
            if word in text_lower:
                return text_lower + f" (category: {main_cat})"

    return text_lower


# ─────────────────────────────────────────────────────────
# 1️⃣ DOWNLOAD DATASET (KAGGLEHUB)
# ─────────────────────────────────────────────────────────
print("⬇️ Downloading dataset...")
path = kagglehub.dataset_download(
    "shriyashjagtap/indian-personal-finance-and-spending-habits"
)

# 🔥 Auto-detect CSV file
files = os.listdir(path)
csv_files = [f for f in files if f.endswith(".csv")]

if not csv_files:
    raise FileNotFoundError("❌ No CSV file found in downloaded dataset")

csv_path = os.path.join(path, csv_files[0])
print(f"✅ Using dataset file: {csv_path}")

df = pd.read_csv(csv_path)

# ─────────────────────────────────────────────────────────
# 2️⃣ CREATE TEXT FOR EMBEDDING
# ─────────────────────────────────────────────────────────
df['text'] = (
    "Income: " + df['Income'].astype(str) +
    ", Rent: " + df['Rent'].astype(str) +
    ", Groceries: " + df['Groceries'].astype(str) +
    ", Transport: " + df['Transport'].astype(str) +
    ", Advice: Optimize spending and increase savings."
)

# ─────────────────────────────────────────────────────────
# 3️⃣ LOAD EMBEDDING MODEL
# ─────────────────────────────────────────────────────────
print("🔄 Loading embedding model...")
MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "all-MiniLM-L6-v2")
)
model = SentenceTransformer(MODEL_PATH)

# ─────────────────────────────────────────────────────────
# 4️⃣ INIT FAISS
# ─────────────────────────────────────────────────────────
faiss_store = FaissStore(dim=384)

# ─────────────────────────────────────────────────────────
# 5️⃣ ADD ADVICE DATA
# ─────────────────────────────────────────────────────────
print("📊 Indexing advice dataset...")

normalized_advice_texts = [
    normalize_text(t) for t in df['text'].tolist()
]

advice_vectors = model.encode(
    normalized_advice_texts,
    convert_to_numpy=True
)

advice_metadata = [
    {
        "source": "advice",
        "text": normalized_advice_texts[i]
    }
    for i in range(len(normalized_advice_texts))
]

faiss_store.add_vectors(advice_vectors, advice_metadata)

# ─────────────────────────────────────────────────────────
# 6️⃣ ADD MONGODB EXPENSES
# ─────────────────────────────────────────────────────────
print("💸 Indexing MongoDB expenses...")

expenses = fetch_all_expenses()

if not expenses:
    print("⚠️ No expenses found in MongoDB")

expense_texts = [
    f"{e['category']} ₹{e['amount']} {e['date']}"
    for e in expenses
]

normalized_expense_texts = [
    normalize_text(t) for t in expense_texts
]

expense_vectors = model.encode(
    normalized_expense_texts,
    convert_to_numpy=True
)

expense_metadata = [
    {
        "source": "expense",
        "mongo_id": str(e['_id']),
        "text": normalized_expense_texts[i]
    }
    for i, e in enumerate(expenses)
]

faiss_store.add_vectors(expense_vectors, expense_metadata)

# ─────────────────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────────────────
print("✅ FAISS populated successfully with:")
print(f"   - {len(advice_metadata)} advice records")
print(f"   - {len(expense_metadata)} expense records")