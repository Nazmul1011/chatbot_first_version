# ChatAgent: Multi-Tenant AI Support SaaS 🚀

ChatAgent is a powerful SaaS platform that allows businesses to upload their own knowledge base (PDFs/Text) and instantly embed a custom AI support assistant on their websites.

## ✨ Key Features

- **Multi-Tenant Architecture**: Securely manage multiple clients. Each client has their own isolated data and AI personality.
- **RAG Powered (Retrieval-Augmented Generation)**: Uses vector search (PgVector) to ensure the AI answers based *only* on the provided documents. No hallucinations.
- **Premium Embeddable Widget**: A standalone, lightweight `embed.js` widget that can be added to any website with one line of code.
- **Natural Conversations**: Fine-tuned persona for warm, empathetic, and human-like support responses.
- **Persistent Chat**: Remembers the conversation history even if the user refreshes their browser.
- **Real-time Analytics**: A dashboard for tenants to track total queries, average response time, and success rates.

## 🛠️ Tech Stack

- **Backend**: Django, Django REST Framework, PostgreSQL (PgVector).
- **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons.
- **AI/ML**: DeepSeek LLM (via OpenRouter), Sentence-Transformers (Embeddings), LangChain (Text Splitting).
- **Database**: PostgreSQL with Vector support for semantic search.

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (for database)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ How to Embed on any Website
To add the chat assistant to your site, simply paste this script into your HTML:

```html
<script 
  src="http://localhost:3000/embed.js" 
  data-api-key="YOUR_TENANT_API_KEY_HERE"
  async>
</script>
```

## 🔐 Security
- **Token-based API Authentication** for the dashboard.
- **Public API Key Isolation** for the embedded widgets.
- **CORS Restricted** for production environments to prevent unauthorized site embedding.

---
Built with ❤️ by Nazmul Hasan.
