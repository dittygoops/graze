import os
import requests
import time
from dotenv import load_dotenv

load_dotenv()
    
def get_nearby_restaurants(lat, long, radius, max_results=50):
    """
    Get nearby restaurants using Google Places API.
    Fetches up to max_results by using pagination.
    
    Args:
        lat (float): Latitude
        long (float): Longitude
        radius (int): Search radius in meters
        max_results (int): Maximum number of results to fetch (default: 50, max: 60)
    
    Returns:
        list: List of restaurant objects from Google Places
    """
    api_key = os.getenv('GOOGLE_PLACES_API_KEY')
    
    if not api_key:
        raise ValueError('GOOGLE_PLACES_API_KEY not found in environment variables')
    
    # Google Places API Nearby Search endpoint
    url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    
    params = {
        'location': f'{lat},{long}',
        'radius': radius,
        'type': 'restaurant',
        'key': api_key
    }
    
    all_restaurants = []
    next_page_token = None
    
    try:
        # Fetch first page
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('status') != 'OK':
            print(f"Google Places API returned status: {data.get('status')}")
            print(f"Error message: {data.get('error_message', 'No error message provided')}")
            return []
        
        all_restaurants.extend(data.get('results', []))
        next_page_token = data.get('next_page_token')
        
        # Fetch additional pages if available and if we need more results
        while next_page_token and len(all_restaurants) < max_results:
            # Google requires a short delay before the next_page_token becomes valid
            time.sleep(2)
            
            page_params = {
                'pagetoken': next_page_token,
                'key': api_key
            }
            
            response = requests.get(url, params=page_params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') == 'OK':
                all_restaurants.extend(data.get('results', []))
                next_page_token = data.get('next_page_token')
            else:
                # No more results or error occurred
                break
        
        # Return up to max_results
        return all_restaurants[:max_results]
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from Google Places API: {e}")
        return all_restaurants if all_restaurants else []

