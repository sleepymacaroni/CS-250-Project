import {useSearchParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {getMarketplaceCrops} from "../../services/cropsApi";
import MarketplaceGrid from "./MarketplaceGrid";
import Pagination, {PAGE_SIZE} from "../../ui/Pagination";

function MarketplaceLayout() {
  const {data: crops = [], isLoading, error, isError} = useQuery({
    queryKey: ["marketplaceCrops"],
    queryFn: getMarketplaceCrops,
  });
  const [searchParams] = useSearchParams();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loader"></span>
      </div>
    );

  if (isError)
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 p-6 text-error">
        Could not load marketplace crops: {error.message}
      </div>
    );

  const filterValue = searchParams.get("status") || "all";
  let filteredCrops = crops;

  if (filterValue === "harvest-soon")
    filteredCrops = crops.filter((crop) => crop.status === "HARVEST_SOON");
  if (filterValue === "future")
    filteredCrops = crops.filter((crop) => crop.status === "FUTURE");
  if (filterValue === "available")
    filteredCrops = crops.filter((crop) => crop.status === "AVAILABLE");

  const sortBy = searchParams.get("sortBy") || "predictedHarvestDate-asc";
  const [field, direction] = sortBy.split("-");
  const modifier = direction === "asc" ? 1 : -1;

  const sortedCrops = filteredCrops.slice().sort((a, b) => {
    if (field === "predictedHarvestDate") {
      return (
        (new Date(a.predictedHarvestDate) - new Date(b.predictedHarvestDate)) *
        modifier
      );
    }

    return ((Number(a[field]) || 0) - (Number(b[field]) || 0)) * modifier;
  });

  const page = !searchParams.get("page") ? 1 : Number(searchParams.get("page"));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  const paginatedCrops = sortedCrops.slice(from, to);

  return (
    <div>
      <div className="bg-bg flex justify-center p-3">
        <Pagination count={sortedCrops.length} />
      </div>
      <MarketplaceGrid crops={paginatedCrops} />
    </div>
  );
}

export default MarketplaceLayout;
