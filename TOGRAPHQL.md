# Roadmap: Order App -> Go GraphQL API

This roadmap explains how the Order (user) app connects to the backend today, and how to migrate it to the Go GraphQL API with minimal risk.

## Current connectivity (Order App)
1. HTTP base URL comes from `VITE_API_ENDPOINT` in `src/order/.env.local`.
2. REST calls are made via `src/order/src/queries/axiosInstance.ts`.
3. Data hooks used by the Order App:
   - `useEntryInfo.ts` → REST GETs for restaurant, location, origin, campaign.
   - `useMenus.ts` → REST GET list of menus (already supports GraphQL when `VITE_GRAPHQL_ENDPOINT` is set).
   - `useMenu.ts` → REST GET menu details.
   - Order flow hooks (preview order, checkout, status) use REST endpoints.

## Migration roadmap (GraphQL)
1. **Implement `menus` query (simple, already demoed)**
   - GraphQL: `menus(restaurantId, locationId) -> [MenuSummary]`
   - Reason: minimal payload, read-only, already wired via `VITE_GRAPHQL_ENDPOINT` in `useMenus.ts`.
   - Goal: prove connectivity without touching checkout or auth.

2. Add `restaurant` and `location` queries (entry page readiness)
   - GraphQL: `restaurant(id)`, `location(restaurantId, locationId)`
   - Update `useEntryInfo.ts` to fetch these via GraphQL when `VITE_GRAPHQL_ENDPOINT` is set.

3. Add `origin` and `campaign` queries (full entry flow)
   - GraphQL: `origin(originId)`, `campaign(restaurantId, locationId, originId)`
   - Update `useEntryInfo.ts` to switch these calls to GraphQL under the same flag.

4. Add `menu` query (menu detail page)
   - GraphQL: `menu(restaurantId, locationId, menuId)` returning full menu structure.
   - Update `useMenu.ts` to use GraphQL under `VITE_GRAPHQL_ENDPOINT`.

5. Add `createPreviewOrder` mutation (cart flow)
   - GraphQL: `createPreviewOrder(input)` with pricing + discount logic parity.
   - Update `useCreatePreviewOrderQuery.ts` to use GraphQL.

6. Add `checkout` mutation + `orderStatus` query
   - GraphQL: `checkout(input)` + `orderStatus(orderId)`
   - Update `useCreateOrder.ts` / `useOrderStatus.ts` to use GraphQL.

7. Remove REST dependency (optional final step)
   - Once all queries/mutations are GraphQL, remove REST fallbacks and `VITE_API_ENDPOINT` usage.
   - Keep `ApiResponse<T>` validation or update Zod parsing to match GraphQL errors.

## Notes
- Keep response shapes aligned with existing Zod schemas in `src/order/src/queries/*`.
- Migrate one hook at a time, keeping REST as fallback until parity is confirmed.
- Avoid changing frontend data models until all GraphQL resolvers match current shapes.
