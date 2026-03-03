export interface GooglePlacesRestaurant {
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  place_id: string;
  types: string[];
  geometry: {
    location: { lat: number; lng: number };
  };
}

export async function getNearbyRestaurants(
  lat: number,
  long: number,
  radius: number,
  maxResults = 50
): Promise<GooglePlacesRestaurant[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY not found in environment variables');

  const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
  const all: GooglePlacesRestaurant[] = [];

  const fetchPage = async (params: Record<string, string>) => {
    const url = `${baseUrl}?${new URLSearchParams(params)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google Places API error: ${res.statusText}`);
    return res.json() as Promise<{ status: string; results: GooglePlacesRestaurant[]; next_page_token?: string; error_message?: string }>;
  };

  const data = await fetchPage({ location: `${lat},${long}`, radius: String(radius), type: 'restaurant', key: apiKey });

  if (data.status !== 'OK') {
    console.error(`Google Places API status: ${data.status}`, data.error_message ?? '');
    return [];
  }

  all.push(...data.results);
  let nextPageToken = data.next_page_token;

  while (nextPageToken && all.length < maxResults) {
    await new Promise(r => setTimeout(r, 2000)); // Google requires delay before using page token
    const pageData = await fetchPage({ pagetoken: nextPageToken, key: apiKey });
    if (pageData.status !== 'OK') break;
    all.push(...pageData.results);
    nextPageToken = pageData.next_page_token;
  }

  return all.slice(0, maxResults);
}
