# Demo Video: Go GraphQL Endpoint + Mobile App

## Quick URLs (local)
- Menus list (Cuppa Co): `http://localhost:5173/menus/cuppa_co/lynnwood/ccfc45b12c4e8b87cf09d264?originId=27e6e5ea1966967c83f6a9b5`

## Goal
Show the Order App fetching menus from the new Go GraphQL endpoint.

## What changed in the repo
- Go GraphQL demo service: `src/go-graphql-demo/main.go`
- Optional GraphQL path in the Order App menus query: `src/order/src/queries/useMenus.ts`

## Prereqs
- Go 1.21+
- Node.js + npm

## Setup steps
1. Start all apps (Order, Manage, API, Go GraphQL demo):
   ```bash
   dev/start-apps.sh
   ```
   Expected logs include `Go GraphQL demo listening on :8080` in the `go-graphql` pane.

2. Point the Order App to the GraphQL endpoint (if not already set):


## Demo recording steps
1. Start screen recording.
2. Show the `dev/start-apps.sh` tmux session and the `go-graphql` pane.
3. Optional CLI check (proves GraphQL works before the UI):
   ```bash
   curl -s http://localhost:8080/graphql -H 'Content-Type: application/json' -d '{"query":"query($restaurantId:String!,$locationId:String!){menus(restaurantId:$restaurantId,locationId:$locationId){_id menuSlug name{en es pt} available}}","variables":{"restaurantId":"cuppa_co","locationId":"ccfc45b12c4e8b87cf09d264"}}' | jq
   ```
4. Open the Order App menus page using a seeded originId:
   - Cuppa Co originId: `27e6e5ea1966967c83f6a9b5`
   - URL: `http://localhost:5173/menus/cuppa_co/lynnwood/ccfc45b12c4e8b87cf09d264?originId=27e6e5ea1966967c83f6a9b5`
5. Open DevTools Network tab and filter for `graphql`.
6. Click the GraphQL request and show:
   - Request payload with `query Menus` and `restaurantId/locationId` variables.
   - Response payload listing menu summaries.
7. Refresh the menu page to show the list still loads via GraphQL.

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