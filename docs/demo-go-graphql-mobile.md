# Demo Video: Go GraphQL Endpoint + Mobile App

## Goal
Show the Order App fetching menus from the new Go GraphQL endpoint.

## What changed in the repo
- Go GraphQL demo service: `src/go-graphql-demo/main.go`
- Optional GraphQL path in the Order App menus query: `src/order/src/queries/useMenus.ts`

## Prereqs
- Go 1.21+
- Node.js + npm

## Setup steps
1. Start the Go GraphQL server:
   ```bash
   cd src/go-graphql-demo
   go run .
   ```
   Expected log: `Go GraphQL demo listening on :8080`

2. Point the Order App to the GraphQL endpoint:
   ```bash
   cd src/order
   cat <<'ENV' > .env.local
   VITE_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
   VITE_API_ENDPOINT=http://localhost:3000
   ENV
   ```
   `VITE_API_ENDPOINT` can be any existing API base URL; menus will come from GraphQL when `VITE_GRAPHQL_ENDPOINT` is set.

3. Run the Order App:
   ```bash
   npm install
   npm run dev
   ```

## Demo recording steps
1. Start screen recording.
2. Show the terminal running the Go server (`go run .`).
3. Open the Order App in the browser and navigate to the menu page.
4. Open DevTools Network tab and filter for `graphql`.
5. Click the GraphQL request and show:
   - Request payload with `query Menus` and `restaurantId/locationId` variables.
   - Response payload listing menu summaries.
6. Refresh the menu page to show the list still loads via GraphQL.

## Example GraphQL query
```graphql
query Menus($restaurantId: String!, $locationId: String!) {
  menus(restaurantId: $restaurantId, locationId: $locationId) {
    _id
    menuSlug
    name {
      en
      es
      pt
    }
    available
  }
}
```

## Expected result
The Order App menu list renders using data from the Go GraphQL service while the rest of the app continues to use the existing REST API.
