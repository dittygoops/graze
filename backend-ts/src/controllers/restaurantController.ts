import { getNearbyRestaurants } from '../services/googlePlaces';
import { getRestaurantFromDb, storeRestaurant } from '../services/database';
import { generateRestaurantTags } from '../services/groqApi';

export interface RestaurantResult {
  name: string;
  place_id: string;
  address: string;
  lat: number;
  long: number;
  rating?: number;
  total_ratings?: number;
  tags: string[];
}

export async function getRestaurants(lat: number, long: number, radius: number): Promise<RestaurantResult[]> {
  const restaurants = await getNearbyRestaurants(lat, long, radius);
  const results: RestaurantResult[] = [];

  for (const restaurant of restaurants) {
    const { name, vicinity, rating, user_ratings_total, place_id, geometry } = restaurant;
    const { lat: rLat, lng: rLng } = geometry.location;

    const dbRecord = await getRestaurantFromDb(name);
    let tags: string[];

    if (dbRecord?.tags?.length) {
      console.log(`[Controller] Cache hit for "${name}"`);
      tags = dbRecord.tags;
    } else {
      console.log(`[Controller] Generating tags for "${name}"...`);
      tags = await generateRestaurantTags(restaurant);
      console.log(`[Controller] Tags for "${name}":`, tags);
      await storeRestaurant({
        name,
        tags,
        address: vicinity,
        rating,
        total_ratings: user_ratings_total,
        lat: rLat,
        long: rLng,
        place_id,
      });
    }

    results.push({ name, place_id, address: vicinity, lat: rLat, long: rLng, rating, total_ratings: user_ratings_total, tags });
  }

  return results;
}
