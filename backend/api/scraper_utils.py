import requests
from bs4 import BeautifulSoup
import re

def scrape_website_text(url):
    """
    Fetches the content of a URL and extracts clean text. 
    Includes title and meta descriptions for better AI context.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=20)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Capture Title and Meta for better AI understanding
        title = soup.title.string if soup.title else ""
        meta_desc = ""
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag:
            meta_desc = meta_tag.get("content", "")

        # Remove scripts and styles
        for element in soup(["script", "style", "iframe", "header", "footer"]):
            element.decompose()

        # Get main content text
        # Try to find common content containers first
        content_nodes = soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'li', 'article', 'section'])
        text_content = [node.get_text(separator=' ', strip=True) for node in content_nodes]
        
        full_text = f"Title: {title}\nDescription: {meta_desc}\n\nContent:\n" + "\n".join(text_content)
        
        # Clean up whitespace
        clean_text = re.sub(r'\n+', '\n', full_text).strip()
        
        # If we got almost nothing, try a fallback to full body text
        if len(clean_text) < 100:
            clean_text = soup.get_text(separator=' ', strip=True)

        return clean_text if len(clean_text) > 20 else None
    except Exception as e:
        print(f"Scraping error for {url}: {e}")
        return None
