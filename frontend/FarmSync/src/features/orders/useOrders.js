/**
 * useOrders
 * ---------
 * React Query hook that fetches all orders for the current user.
 */

import {useQuery} from "@tanstack/react-query";
import {getOrders} from "../../services/ordersApi";

export function useOrders() {
  const {data: orders = [], isLoading} = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });

  return {orders, isLoading};
}
