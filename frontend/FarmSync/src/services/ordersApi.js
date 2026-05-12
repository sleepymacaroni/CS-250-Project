/**
 * ordersApi.js
 * ------------
 * Mock API for orders — mirrors the pattern used in cropsApi.js.
 * Stores order data in localStorage under the key "farmsync_orders".
 *
 * Replace with real backend calls once the API is ready.
 */

import {getData, setData} from "./storage";

const ORDERS_KEY = "farmsync_orders";

/** Seed orders — pre-populated for the signed-in demo user */
const seedOrders = [
  {
    id: "ORD-001",
    cropName: "Table grapes",
    quantity: 40,
    unitPrice: 5,
    totalPrice: 200,
    status: "COMPLETED",
    orderDate: "2026-03-10",
    estimatedDelivery: "2026-03-28",
    location: "Fresno, CA",
    farmerName: "Green Valley Farm",
  },
  {
    id: "ORD-002",
    cropName: "Almonds",
    quantity: 25,
    unitPrice: 4,
    totalPrice: 100,
    status: "IN_TRANSIT",
    orderDate: "2026-04-22",
    estimatedDelivery: "2026-06-10",
    location: "Bakersfield, CA",
    farmerName: "Sierra Nut Co.",
  },
  {
    id: "ORD-003",
    cropName: "Table grapes",
    quantity: 60,
    unitPrice: 3,
    totalPrice: 180,
    status: "PROCESSING",
    orderDate: "2026-05-01",
    estimatedDelivery: "2026-05-20",
    location: "Modesto, CA",
    farmerName: "Sunburst Growers",
  },
  {
    id: "ORD-004",
    cropName: "Almonds",
    quantity: 15,
    unitPrice: 4,
    totalPrice: 60,
    status: "PENDING",
    orderDate: "2026-05-10",
    estimatedDelivery: "2026-06-30",
    location: "Visalia, CA",
    farmerName: "Oak Ridge Farms",
  },
  {
    id: "ORD-005",
    cropName: "Table grapes",
    quantity: 20,
    unitPrice: 5,
    totalPrice: 100,
    status: "CANCELLED",
    orderDate: "2026-02-14",
    estimatedDelivery: "2026-03-05",
    location: "Tulare, CA",
    farmerName: "Valley Harvest LLC",
  },
];

export function initOrders() {
  try {
    const data = getData(ORDERS_KEY);
    if (!data) setData(ORDERS_KEY, seedOrders);
  } catch (error) {
    console.error(error);
    throw new Error("Could not init orders data");
  }
}

export function getOrders() {
  initOrders();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const data = getData(ORDERS_KEY);
        // Newest first
        resolve([...data].sort((a, b) => b.orderDate.localeCompare(a.orderDate)));
      } catch (error) {
        console.error(error);
        reject(new Error("Could not fetch orders"));
      }
    }, 300);
  });
}

export function cancelOrder(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const orders = getData(ORDERS_KEY) || [];
        const updated = orders.map((o) =>
          o.id === id ? {...o, status: "CANCELLED"} : o
        );
        setData(ORDERS_KEY, updated);
        resolve();
      } catch (error) {
        console.error(error);
        reject(new Error("Could not cancel order"));
      }
    }, 300);
  });
}

/**
 * Called from CropsCard when a buyer clicks "Add to Cart" / "Place Order".
 * Creates a new PENDING order from a marketplace crop.
 */
export function placeOrder({cropName, quantity, unitPrice, location, farmerName, estimatedDelivery}) {
  return new Promise((resolve, reject) => {
    initOrders();
    setTimeout(() => {
      try {
        const orders = getData(ORDERS_KEY) || [];
        const newOrder = {
          id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
          cropName,
          quantity,
          unitPrice,
          totalPrice: quantity * unitPrice,
          status: "PENDING",
          orderDate: new Date().toISOString().split("T")[0],
          estimatedDelivery,
          location,
          farmerName: farmerName ?? "Unknown Farmer",
        };
        setData(ORDERS_KEY, [newOrder, ...orders]);
        resolve(newOrder);
      } catch (error) {
        console.error(error);
        reject(new Error("Could not place order"));
      }
    }, 400);
  });
}
