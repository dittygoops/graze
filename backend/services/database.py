import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Lazy initialization of Supabase client
_supabase_client = None

def get_supabase_client():
    """
    Get or create the Supabase client instance.
    Uses lazy initialization to ensure .env is loaded first.
    """
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if supabase_url and supabase_key:
            _supabase_client = create_client(supabase_url, supabase_key)
        else:
            print("Warning: Supabase credentials not found in environment variables")
            return None
    
    return _supabase_client

def get_restaurant_from_db(restaurant_name):
    """
    Get a restaurant record from the database.
    
    Args:
        restaurant_name (str): Name of the restaurant
    
    Returns:
        dict: Restaurant data with all fields, or None if not found
    """
    supabase = get_supabase_client()
    if not supabase:
        return None
    
    try:
        response = supabase.table('Restaurant').select('*').eq('name', restaurant_name).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        return None
    
    except Exception as e:
        print(f"Error fetching restaurant from database: {e}")
        return None

def store_restaurant(restaurant_name, tags, address=None, rating=None, total_ratings=None, lat=None, long=None, place_id=None):
    """
    Store restaurant with all fields in the database.
    
    Args:
        restaurant_name (str): Name of the restaurant
        tags (list): List of tags
        address (str): Restaurant address
        rating (float): Restaurant rating
        total_ratings (int): Total number of ratings
        lat (float): Latitude
        long (float): Longitude
        place_id (str): Google Places ID
    
    Returns:
        bool: True if successful, False otherwise
    """
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        # Check if restaurant already exists
        existing = supabase.table('Restaurant').select('id').eq('name', restaurant_name).execute()
        
        restaurant_data = {
            'name': restaurant_name,
            'tags': tags,
            'address': address,
            'rating': rating,
            'total_ratings': total_ratings,
            'lat': lat,
            'long': long,
            'place_id': place_id
        }
        
        if existing.data and len(existing.data) > 0:
            # Update existing restaurant
            supabase.table('Restaurant').update(restaurant_data).eq('name', restaurant_name).execute()
        else:
            # Insert new restaurant
            supabase.table('Restaurant').insert(restaurant_data).execute()
        
        return True
    
    except Exception as e:
        print(f"Error storing restaurant in database: {e}")
        return False

