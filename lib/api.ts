// drafting-and-reporting/lib/api.ts

const CENTRAL_URL = process.env.NEXT_PUBLIC_CENTRAL_DATA_GRAPHQL_URL || '';
const LIVE_DATA_FEED_URL = process.env.NEXT_PUBLIC_LIVE_DATA_FEED_GRAPHQL_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

interface GraphQLResponse<T> {
  data?: T;
  errors?: any[];
}

export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, any> = {},
  url: string = CENTRAL_URL
): Promise<GraphQLResponse<T>> {
  if (!API_KEY || API_KEY === "YOUR_API_KEY") {
    console.error("AUTHENTICATION ERROR: API key is missing or is the default placeholder.");
    return { errors: [{ message: "Authentication Error: API key is missing or invalid." }] };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data: GraphQLResponse<T> = await response.json();

    if (data.errors) {
      console.error(`GraphQL Errors from ${url}:`, JSON.stringify(data.errors, null, 2));
    }

    if (!response.ok) {
      console.error(`HTTP Error ${response.status} from ${url}:`, data.errors || data);
      return { errors: data.errors || [{ message: `HTTP Error ${response.status}` }] };
    }

    return data;
  } catch (error: any) {
    console.error("Exception during GraphQL request:", error);
    return { errors: [{ message: `Network or parsing error: ${error.message}` }] };
  }
}

// Export the live data feed URL for specific queries
export { LIVE_DATA_FEED_URL };

