// Seed data from docs/menu/*.json without inventing new sample entities.
// Run with: mongosh "mongodb://localhost:27017/orderbuddy" dev/seed-mongo.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDir = path.resolve(process.cwd());

function readJson(relPath) {
  const fullPath = path.join(baseDir, relPath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(raw);
}

function stableObjectId(seed) {
  const hex = crypto.createHash('md5').update(seed).digest('hex').slice(0, 24);
  return ObjectId(hex);
}

function ensureLocale(value, locales) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const en = value.en || '';
    return {
      en: en,
      es: value.es || en,
      pt: value.pt || en,
    };
  }
  if (typeof value === 'string') {
    return { en: value, es: value, pt: value };
  }
  const fallback = locales && locales.length > 0 ? locales[0] : '';
  return { en: fallback, es: fallback, pt: fallback };
}

function buildWorkingHours(schedule) {
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const dayMap = {
    Mon: 'monday',
    Tue: 'tuesday',
    Wed: 'wednesday',
    Thu: 'thursday',
    Fri: 'friday',
    Sat: 'saturday',
    Sun: 'sunday',
  };

  const workingHours = days.map((day) => ({ day, startTime: null, endTime: null, isOpen: false }));

  if (!schedule || schedule.type !== 'time' || !schedule.rules || !Array.isArray(schedule.rules.windows)) {
    return workingHours;
  }

  schedule.rules.windows.forEach((window) => {
    if (!window.days || !window.start || !window.end) return;
    window.days.forEach((d) => {
      const mapped = dayMap[d] || d.toLowerCase();
      const dayEntry = workingHours.find((w) => w.day === mapped);
      if (dayEntry) {
        dayEntry.startTime = window.start;
        dayEntry.endTime = window.end;
        dayEntry.isOpen = true;
      }
    });
  });

  return workingHours;
}

function normalizeMenu(menu, locationId) {
  const locales = menu.locales || ['en'];
  const menuName = ensureLocale(menu.name, locales);

  const categories = (menu.categories || []).map((category) => ({
    id: category._id,
    name: ensureLocale(category.name, locales),
    description: ensureLocale(category.description || '', locales),
    sortOrder: category.sortOrder || 0,
    emoji: category.emoji,
  }));

  const items = (menu.items || []).map((item) => ({
    id: item.id,
    name: ensureLocale(item.names, locales),
    description: ensureLocale(item.descriptions || '', locales),
    imageUrls: item.imageUrls || [],
    categoryId: item.category,
    priceCents: item.offers?.priceCents || 0,
    makingCostCents: item.makingCostCents || 0,
    isAvailable: item.availability?.isAvailable ?? true,
    stationTags: [],
    variants: [],
    modifiers: [],
  }));

  const available = items.some((item) => item.isAvailable);

  return {
    _id: stableObjectId(`menu:${menu._id}`),
    restaurantId: menu.restaurantId,
    locationId,
    menuSlug: menu._id,
    name: menuName,
    categories,
    items,
    schedule: menu.schedule,
    createdAt: new Date(menu.createdAt),
    updatedAt: new Date(menu.updatedAt),
    available,
    salesTax: menu.salesTax || 0,
  };
}

const restaurantFiles = [
  'docs/menu/cuppa-co/cuppa_co_restaurant.json',
  'docs/menu/stacked-up/stacked_up_restaurant.json',
  'docs/menu/tropical_berry_restaurant_schema.json',
];

const menuFiles = [
  'docs/menu/cuppa-co/cuppa_co_menu.json',
  'docs/menu/stacked-up/stacked_up_menu.json',
];

const restaurants = restaurantFiles.map(readJson);
const menus = menuFiles.map(readJson);

const locationMap = new Map(); // key: `${restaurantId}:${locationIdString}` -> ObjectId
const menuLocationMap = new Map(); // key: `${restaurantId}:${menuId}` -> ObjectId
const originMap = new Map(); // key: `${restaurantId}:${locationSlug}` -> ObjectId

restaurants.forEach((restaurant) => {
  const restaurantDoc = {
    _id: restaurant._id,
    name: restaurant.name,
    concept: restaurant.concept,
    logo: restaurant.logo,
    createdAt: new Date(restaurant.createdAt),
    updatedAt: new Date(restaurant.updatedAt),
  };
  db.getCollection('restaurants').updateOne({ _id: restaurantDoc._id }, { $set: restaurantDoc }, { upsert: true });

  (restaurant.locations || []).forEach((location) => {
    const locationId = stableObjectId(`location:${restaurant._id}:${location.id}`);
    locationMap.set(`${restaurant._id}:${location.id}`, locationId);

    const locationDoc = {
      _id: locationId,
      restaurantId: restaurant._id,
      locationSlug: location.id,
      name: location.name,
      address: location.address,
      timezone: location.timezone,
      isActive: location.isActive,
      qrCodeStyle: {},
      qrCodeImage: '',
      qrCodeId: '',
      createdAt: new Date(restaurant.createdAt),
      updatedAt: new Date(restaurant.updatedAt),
      contact: { email: location.contact?.email || '' },
      payment: { acceptPayment: false, emergepayWalletsPublicId: '' },
      workingHours: buildWorkingHours((location.menus || [])[0]?.schedule),
      orderTiming: { acceptOrdersAfterMinutes: 0, stopOrdersBeforeMinutes: 0 },
      isMobile: true,
      printers: [],
      autoAcceptOrder: false,
    };

    db.getCollection('locations').updateOne({ _id: locationDoc._id }, { $set: locationDoc }, { upsert: true });

    (location.menus || []).forEach((menuRef) => {
      menuLocationMap.set(`${restaurant._id}:${menuRef.id}`, locationId);
    });

    const originId = stableObjectId(`origin:${restaurant._id}:${location.id}`);
    originMap.set(`${restaurant._id}:${location.id}`, originId);
    const originDoc = {
      _id: originId,
      restaurantId: restaurant._id,
      locationId: locationId,
      qrCodeId: `origin_${restaurant._id}_${location.id}`,
      type: 'table',
      label: 'Table 1',
      qrCode: 'https://order.orderbuddyapp.com/',
    };
    db.getCollection('origins').updateOne({ _id: originDoc._id }, { $set: originDoc }, { upsert: true });
  });
});

menus.forEach((menu) => {
  const locationId = menuLocationMap.get(`${menu.restaurantId}:${menu._id}`);
  if (!locationId) {
    print(`Skipping menu ${menu._id}: no location mapping found.`);
    return;
  }
  const menuDoc = normalizeMenu(menu, locationId);
  db.getCollection('menus').updateOne({ _id: menuDoc._id }, { $set: menuDoc }, { upsert: true });
});

print('Seed complete.');
print('Restaurants seeded:');
restaurants.forEach((restaurant) => print(`- ${restaurant._id}`));
print('Locations seeded (restaurant:locationSlug -> ObjectId):');
[...locationMap.entries()].forEach(([key, id]) => print(`- ${key} -> ${id.valueOf()}`));
print('Menus seeded (menuSlug -> ObjectId):');
menus.forEach((menu) => {
  const locationId = menuLocationMap.get(`${menu.restaurantId}:${menu._id}`);
  if (!locationId) return;
  const menuId = stableObjectId(`menu:${menu._id}`).valueOf();
  print(`- ${menu._id} -> ${menuId}`);
});
print('Origins seeded (restaurant:locationSlug -> ObjectId):');
[...originMap.entries()].forEach(([key, id]) => print(`- ${key} -> ${id.valueOf()}`));
