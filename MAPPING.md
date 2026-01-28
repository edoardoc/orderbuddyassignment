# Seed Mapping Notes

This note documents how `dev/seed-mongo.js` maps the sample JSON files in `docs/menu/` into the MongoDB collections used by the API.

## Source files
- `docs/menu/cuppa-co/cuppa_co_restaurant.json`
- `docs/menu/cuppa-co/cuppa_co_menu.json`
- `docs/menu/stacked-up/stacked_up_restaurant.json`
- `docs/menu/stacked-up/stacked_up_menu.json`
- `docs/menu/tropical_berry_restaurant_schema.json`

## Collections populated
- `restaurants`
- `locations`
- `origins`
- `menus`

## ID strategy
- Restaurant `_id` uses the source JSON `_id` string (no change).
- Location `_id` is a deterministic ObjectId derived from `restaurantId + location.id`.
- Menu `_id` is a deterministic ObjectId derived from the menu JSON `_id`.
- Deterministic ObjectIds are created by hashing the seed string (MD5) and taking the first 24 hex chars.

## Field mapping: restaurants
- `_id`, `name`, `concept`, `logo`, `createdAt`, `updatedAt` are taken directly from the restaurant JSON.

## Field mapping: locations
- `locationSlug` is taken from `locations[].id`.
- `restaurantId`, `name`, `address`, `timezone`, `isActive` come from the restaurant JSON.
- `contact.email` is mapped if present; otherwise empty string.
- `workingHours` is derived from the first menu schedule window in that location.
- Other fields required by the API model but not present in docs are defaulted:
  - `payment.acceptPayment = false`, `payment.emergepayWalletsPublicId = ''`
  - `qrCodeStyle = {}`, `qrCodeImage = ''`, `qrCodeId = ''`
  - `orderTiming.acceptOrdersAfterMinutes = 0`, `stopOrdersBeforeMinutes = 0`
  - `isMobile = true`, `autoAcceptOrder = false`, `printers = []`

## Field mapping: menus
The docs menu files follow the `docs/menu/menu_schema.json` shape. The API expects a slightly different shape, so the seed script normalizes fields:
- `_id` becomes a deterministic ObjectId based on `menu._id`.
- `menuSlug = menu._id` (string).
- `restaurantId` is the same string from the menu JSON.
- `locationId` is looked up from the restaurant + menu relationship (`restaurant.locations[].menus[].id`).
- `name` is normalized into `{ en, es, pt }`.
- `categories` are mapped from `categories[].{_id,name,description,sortOrder}` to `{id,name,description,sortOrder}`.
- `items` are mapped from the docs schema to the API shape:
  - `name` from `names`, `description` from `descriptions`
  - `categoryId` from `category`
  - `priceCents` from `offers.priceCents`
  - `isAvailable` from `availability.isAvailable`
  - `imageUrls` default to `[]` if missing
  - `variants`, `modifiers`, `stationTags` default to empty arrays (not present in docs menus)
- `available` is computed from whether any item has `isAvailable = true`.
- `salesTax` defaults to `0` if not present in the menu JSON.

## Field mapping: origins (dev-only)
Origins are not present in `docs/menu`, so a minimal origin record is created per location to allow the Order App to render. The origin is derived from the restaurant + location and uses deterministic ObjectIds so it is stable across runs.

## Local DB credentials
The local MongoDB instance was configured with the same root credentials as `dev/docker-compose.dev.yml`:
- Username: `mongoroot`
- Password: `mongorootpwd`

Note: enabling auth in the local MongoDB server config is required if you want these credentials enforced on every connection.
