import {useQuery} from "@tanstack/react-query";
import {getCrops} from "../../services/cropsApi";

export function useCrops() {
  const {
    isLoading,
    data: crops = [],
    error,
    isError,
  } = useQuery({
    queryKey: ["crops"],
    queryFn: getCrops,
    retry: 1,
  });

  return {isLoading, crops, error, isError};
}
