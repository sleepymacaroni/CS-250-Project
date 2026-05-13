/**
 * CropsCard
 * ---------
 * Displays a single crop in marketplace format.
 *
 * Marketplace actions (Farmer vs Buyer):
 * - Farmer: can only preview their listings (View Listing)
 * - Buyer:  can preview listings and buy 1 unit of AVAILABLE crops
 *
 * When a buyer places an order the full crop object (CropResponse) is
 * passed directly to placeOrder — no extra fields are added or invented.
 */

import {useMutation, useQueryClient} from "@tanstack/react-query";
import toast from "react-hot-toast";

import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import {formatStatus} from "../../utils/formatStatus";
import {isBuyer} from "../../services/authApi";
import {placeOrder} from "../../services/ordersApi";
import ListingDetails from "./ListingDetails";

function CropsCard({crop}) {
  const queryClient = useQueryClient();
  const {mutate: buyCrop, isPending: isBuying} = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      toast.success("Order placed");
      queryClient.invalidateQueries({queryKey: ["orders"]});
      queryClient.invalidateQueries({queryKey: ["marketplaceCrops"]});
    },
    onError: (error) => toast.error(error.message),
  });

  function handleBuy() {
    // Pass the crop object as-is; placeOrder only reads CropResponse fields.
    buyCrop(crop);
  }

  const {
    name: cropType,
    status,
    location,
    predictedHarvestDate,
    quantity,
    price,
  } = crop;

  const styledStatus = getStatusStyles(status);

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
            Crop
          </p>
          <h3 className="text-[17px] font-semibold text-text-primary">
            {cropType}
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap ${styledStatus}`}
        >
          {formatStatus(status)}
        </span>
      </div>

      <div className="mb-5 space-y-3 text-sm text-text-secondary">
        <div className="flex items-center justify-between">
          <span>Location</span>
          <span className="font-medium text-text-primary">{location}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Harvest date</span>
          <span className="font-medium text-text-primary">
            {predictedHarvestDate}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Available units</span>
          <span className="font-medium text-text-primary">{quantity}</span>
        </div>
      </div>

      <div className="mb-5 rounded-xl bg-bg px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-text-secondary">
          Unit price
        </p>
        <p className="text-2xl font-bold text-action-primary">${price}</p>
      </div>

      <div className="grid gap-3">
        <Modal>
          <Modal.Open opens="listing-details">
            <Button
              className="w-full"
              variation={isBuyer() ? "secondary" : "primary"}
            >
              View Listing
            </Button>
          </Modal.Open>
          <Modal.Window name="listing-details">
            <ListingDetails crop={crop} />
          </Modal.Window>
        </Modal>

        {isBuyer() && (
          <Button
            className="w-full"
            onClick={handleBuy}
            disabled={isBuying || status !== "AVAILABLE"}
          >
            {status === "AVAILABLE" ? "Buy 1 unit" : "Not available yet"}
          </Button>
        )}
      </div>
    </article>
  );
}

export default CropsCard;

function getStatusStyles(status) {
  if (status === "AVAILABLE") return "bg-green-100 text-green-800";
  if (status === "HARVEST_SOON") return "bg-yellow-100 text-yellow-800";
  if (status === "FUTURE") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-700";
}
