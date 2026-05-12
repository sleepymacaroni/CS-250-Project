import {useCrops} from "../crops/useCrops";
import {
  getDashboardStats,
  getHarvestTimelineData,
  getCropsByStatusData,
  getUpcomingCrops,
} from "./dashboardData";

/**
 * useDashboardData
 * ----------------
 * Custom hook that prepares all data required for the Dashboard.
 *
 * Combines:
 * - data fetching (useCrops)
 * - data transformation (dashboardData helpers)
 *
 * Returns ready-to-use data for UI components.
 */
export function useDashboardData() {
  const {crops = [], isLoading, error, isError} = useCrops();

  const stats = getDashboardStats(crops);
  const timelineData = getHarvestTimelineData(crops);
  const statusData = getCropsByStatusData(crops);
  const upcomingCrops = getUpcomingCrops(crops);

  return {
    isLoading,
    error,
    isError,
    upcomingCrops,
    stats,
    timelineData,
    statusData,
  };
}
