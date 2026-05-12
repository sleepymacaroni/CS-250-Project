/**
 * useCancelOrder
 * --------------
 * React Query mutation that cancels a PENDING order.
 */

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {cancelOrder as cancelOrderApi} from "../../services/ordersApi";
import toast from "react-hot-toast";

export function useCancelOrder() {
  const queryClient = useQueryClient();

  const {mutate: cancelOrder} = useMutation({
    mutationFn: cancelOrderApi,
    onSuccess: () => {
      toast.success("Order cancelled successfully.");
      queryClient.invalidateQueries({queryKey: ["orders"]});
    },
    onError: () => {
      toast.error("Could not cancel order. Please try again.");
    },
  });

  return {cancelOrder};
}
