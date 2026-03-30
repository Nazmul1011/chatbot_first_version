import os
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import openai
from django.conf import settings

# Initialize the embedding model locally (CPU-friendly)
# Dimensions: 384
model = SentenceTransformer('all-MiniLM-L6-v2')

def extract_text_from_file(file_path):
    """
    Extracts text from PDF or TXT files.
    """
    ext = os.path.splitext(file_path)[-1].lower()
    text = ""
    
    if ext == '.pdf':
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
    
    return text

def chunk_text(text):
    """
    Splits text into chunks for better retrieval.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len,
    )
    return text_splitter.split_text(text)

def generate_embedding(text):
    """
    Generates a 384D embedding for the given text.
    """
    return model.encode(text).tolist()

def get_ai_response(question, context):
    """
    Uses DeepSeek API to generate an answer based ONLY on the provided context.
    """
    client = openai.OpenAI(
        api_key=os.getenv("DEEPSEEK_API_KEY"),
        base_url="https://openrouter.ai/api/v1"
    )
    
    prompt = f"""
    You are a warm, helpful human support guide. Your name is the AI Assistant.
    
    CRITICAL RULES FOR NATURAL CONVERSATION:
    - Respond like a friendly person, not a search engine. 
    - NEVER use phrases like "Based on the provided context" or "According to the text." 
    - Just answer the question directly and naturally.
    - Use "I" and "You" to sound more human.
    - If appropriate, end with a helpful follow-up question to keep the user engaged.
    
    If the answer isn't in the INFORMATION below, kindly let them know you're not sure about that specific detail, but offer to help with anything else you DO know about.
    
    INFORMATION:
    {context}
    
    QUESTION:
    {question}
    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek/deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a warm, empathetic human support assistant. You speak naturally and avoid robotic, formulaic language. You are helpful and proactive."},
                {"role": "user", "content": prompt},
            ],
            stream=False
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error communicating with AI: {str(e)}"
