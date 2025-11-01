import os
from groq import Groq
import json
from dotenv import load_dotenv

load_dotenv()

# Lazy initialization of Groq client
_groq_client = None

def get_groq_client():
    """
    Get or create the Groq client instance.
    Uses lazy initialization to ensure .env is loaded first.
    """
    global _groq_client
    
    if _groq_client is None:
        groq_api_key = os.getenv('GROQ_API_KEY')
        
        if groq_api_key:
            _groq_client = Groq(api_key=groq_api_key)
        else:
            print("Warning: GROQ_API_KEY not found in environment variables")
            return None
    
    return _groq_client

import os
from groq import Groq
import json
from dotenv import load_dotenv

load_dotenv()

# Lazy initialization of Groq client
_groq_client = None

def get_groq_client():
    """
    Get or create the Groq client instance.
    Uses lazy initialization to ensure .env is loaded first.
    """
    global _groq_client
    
    if _groq_client is None:
        groq_api_key = os.getenv('GROQ_API_KEY')
        
        if groq_api_key:
            _groq_client = Groq(api_key=groq_api_key)
        else:
            print("Warning: GROQ_API_KEY not found in environment variables")
            return None
    
    return _groq_client

def generate_restaurant_tags(restaurant):
    """
    Generate tags for a restaurant using Groq AI.
    
    Args:
        restaurant (dict): Restaurant object from Google Places
    
    Returns:
        list: List of generated tags
    """
    client = get_groq_client()
    if not client:
        return ['restaurant']  # Default fallback tag
    
    try:
        restaurant_name = restaurant.get('name', 'Unknown')
        restaurant_types = restaurant.get('types', [])
        
        # Create a prompt for the AI
        prompt = f"""Given a restaurant named "{restaurant_name}" with the following types: {', '.join(restaurant_types)}, 
generate 3-5 relevant tags that describe this restaurant. The tags should be short, descriptive words or phrases.

Return ONLY a JSON array of strings, nothing else. Example: ["italian", "fine dining", "romantic"]"""
        
        # Use llama-3.3-70b-versatile (free tier model)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",  # Free tier model
            temperature=0.7,
            max_tokens=100,
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        
        # Try to parse the response as JSON
        try:
            tags = json.loads(response_text)
            if isinstance(tags, list) and all(isinstance(tag, str) for tag in tags):
                return tags
        except json.JSONDecodeError:
            pass
        
        # Fallback: extract tags from response
        return extract_tags_from_text(response_text)
    
    except Exception as e:
        print(f"Error generating tags with Groq: {e}")
        return ['restaurant']  # Default fallback

def extract_tags_from_text(text):
    """
    Extract tags from text response if JSON parsing fails.
    
    Args:
        text (str): Response text
    
    Returns:
        list: List of extracted tags
    """
    # Simple extraction: look for words in quotes or comma-separated values
    tags = []
    
    # Try to find quoted strings
    import re
    quoted = re.findall(r'"([^"]*)"', text)
    if quoted:
        tags = quoted[:5]  # Limit to 5 tags
    
    if not tags:
        # Fallback to splitting by commas
        parts = text.replace('[', '').replace(']', '').split(',')
        tags = [part.strip().strip('"').strip("'") for part in parts if part.strip()][:5]
    
    return tags if tags else ['restaurant']



def extract_tags_from_text(text):
    """
    Extract tags from text response if JSON parsing fails.
    
    Args:
        text (str): Response text
    
    Returns:
        list: List of extracted tags
    """
    # Simple extraction: look for words in quotes or comma-separated values
    tags = []
    
    # Try to find quoted strings
    import re
    quoted = re.findall(r'"([^"]*)"', text)
    if quoted:
        tags = quoted[:5]  # Limit to 5 tags
    
    if not tags:
        # Fallback to splitting by commas
        parts = text.replace('[', '').replace(']', '').split(',')
        tags = [part.strip().strip('"').strip("'") for part in parts if part.strip()][:5]
    
    return tags if tags else ['restaurant']

