from services.google_places import get_nearby_restaurants
from services.database import get_restaurant_from_db, store_restaurant
from services.groq_api import generate_restaurant_tags

def get_restaurants(lat, long, radius):
    """
    Main controller function to get restaurants with tags.
    
    Args:
        lat (float): Latitude
        long (float): Longitude
        radius (int): Search radius in meters
    
    Returns:
        list: List of restaurant objects with tags
    """
    result = []
    
    # Get nearby restaurants from Google Places API
    restaurants = get_nearby_restaurants(lat, long, radius)
    
    # Process each restaurant
    for restaurant in restaurants:
        restaurant_name = restaurant.get('name')
        address = restaurant.get('vicinity')
        rating = restaurant.get('rating')
        total_ratings = restaurant.get('user_ratings_total')
        place_id = restaurant.get('place_id')
        
        # Extract location data
        location = restaurant.get('geometry', {}).get('location', {})
        lat = location.get('lat')
        lng = location.get('lng')
        
        # Try to get restaurant from database
        db_restaurant = get_restaurant_from_db(restaurant_name)
        
        # If restaurant doesn't exist in DB, generate tags and store it
        if not db_restaurant or not db_restaurant.get('tags'):
            # Generate tags using AI
            tags = generate_restaurant_tags(restaurant)
            
            # Store the restaurant with all fields in database
            store_restaurant(restaurant_name, tags, address, rating, total_ratings, lat, lng, place_id)
        else:
            # Use existing tags from database
            tags = db_restaurant.get('tags', [])
        
        # Add restaurant with all data to result
        restaurant_data = {
            'name': restaurant_name,
            'place_id': place_id,
            'address': address,
            'lat': lat,
            'long': lng,  # Google Places API uses 'lng', we map it to 'long'
            'rating': rating,
            'total_ratings': total_ratings,
            'tags': tags
        }
        
        result.append(restaurant_data)
    
    return result

