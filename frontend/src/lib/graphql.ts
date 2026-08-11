const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export class GraphQLError extends Error {
  constructor(public errors: Array<{ message: string }>) {
    super(errors.map((e) => e.message).join(", "));
    this.name = "GraphQLError";
  }
}

/**
 * Executes a GraphQL query/mutation against the SpikeFlow management API.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      ...(variables !== undefined && { variables }),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors && json.errors.length > 0) {
    throw new GraphQLError(json.errors);
  }

  if (!json.data) {
    throw new Error("No data returned from GraphQL server.");
  }

  return json.data;
}
