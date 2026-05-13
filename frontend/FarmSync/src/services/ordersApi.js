/**
 * ordersApi.js
 * ------------
 * Orders are built from real Crop objects returned by the backend
 * (GET /crops/marketplace → CropResponse shape).
 *
 * The crop shape from the backend is:
 *   { id, name, plantingDate, predictedHarvestDate, confidenceScore,
 *     price, quantity, status, location, description }
 *
 * Since there is no dedicated orders endpoint yet, placed orders are
 * persisted in localStorage. Each stored order record contains only
 * fields that come directly from the crop object, plus order-level
 * metadata (orderId, orderDate, orderStatus).
 */

import {getData, setData} from "./storage";
import {getMarketplaceCrops, purchaseCrop} from "./cropsApi";

const ORDERS_KEY = "farmsync_orders";

function getStoredOrders() {
  return getData(ORDERS_KEY) || [];
}

function saveStoredOrders(orders) {
  setData(ORDERS_KEY, orders);
}

/**
 * Merges stored order metadata with live crop data from the backend.
 * quantity is intentionally NOT overwritten — order.quantity is how
 * many units the buyer purchased (1), not the listing's total stock.
 */
async function hydrateOrders(storedOrders) {
  let liveCrops = [];
  try {
    liveCrops = await getMarketplaceCrops();
  } catch {
    // If the backend is unreachable, use the snapshot saved at order time.
  }

  const cropById = Object.fromEntries(liveCrops.map((c) => [c.id, c]));

  return storedOrders.map((order) => {
    const liveCrop = cropById[order.cropId];
    return {
      ...order,
      name: liveCrop?.name ?? order.name,
      price: liveCrop?.price ?? order.price,
      // quantity intentionally kept from order snapshot, not live crop
      status: liveCrop?.status ?? order.status,
      location: liveCrop?.location ?? order.location,
      predictedHarvestDate:
        liveCrop?.predictedHarvestDate ?? order.predictedHarvestDate,
      description: liveCrop?.description ?? order.description,
    };
  });
}

/**
 * Returns all orders for the current user, hydrated with live crop data.
 * Sorted newest-first by orderDate.
 */
export async function getOrders() {
  const stored = getStoredOrders();
  const hydrated = await hydrateOrders(stored);
  return [...hydrated].sort((a, b) => b.orderDate.localeCompare(a.orderDate));
}

/**
 * Places a new order for 1 unit of the given crop, then decrements
 * the crop's quantity on the backend via PUT /crops/{id}.
 *
 * @param {Object} crop  A CropResponse object from getMarketplaceCrops()
 */
export async function placeOrder(crop) {
  // 1. Decrement quantity on the backend via the buyer-accessible endpoint
  await purchaseCrop(crop.id);

  // 2. Save the order locally — quantity is 1 (units purchased), not crop.quantity
  const orders = getStoredOrders();
  const newOrder = {
    orderId: `ORD-${Date.now()}`,
    orderDate: new Date().toISOString().split("T")[0],
    orderStatus: "PENDING",
    cropId: crop.id,
    name: crop.name,
    plantingDate: crop.plantingDate,
    predictedHarvestDate: crop.predictedHarvestDate,
    confidenceScore: crop.confidenceScore,
    price: crop.price,
    quantity: 1,
    status: crop.status,
    location: crop.location,
    description: crop.description,
  };
  saveStoredOrders([newOrder, ...orders]);
  return newOrder;
}

/**
 * Cancels a pending order by its orderId.
 */
export function cancelOrder(orderId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const orders = getStoredOrders();
        const updated = orders.map((o) =>
          o.orderId === orderId ? {...o, orderStatus: "CANCELLED"} : o
        );
        saveStoredOrders(updated);
        resolve();
      } catch (error) {
        console.error(error);
        reject(new Error("Could not cancel order"));
      }
    }, 300);
  });
}
