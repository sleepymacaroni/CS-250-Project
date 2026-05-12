import CropsStatusChart from "./CropsStatusChart";
import HarvestTimelineChart from "./HarvestTimelineChart";
import Stats from "./Stats";
import UpcomingHarvests from "./UpcomingHarvests";
import {useDashboardData} from "./useDashboarData";

function DashboardLayout() {
  const {isLoading, error, isError, upcomingCrops, stats, timelineData, statusData} =
    useDashboardData();

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loader"></span>
      </div>
    );

  if (isError)
    return (
      <div className="rounded-lg border border-error/30 bg-error/10 p-6 text-error">
        Could not load dashboard data: {error.message}
      </div>
    );

  return (
    <div className="grid grid-cols-4 gap-8">
      <div className="col-span-full">
        <Stats stats={stats} />
      </div>
      <div className="col-span-2">
        <UpcomingHarvests upcomingCrops={upcomingCrops} />
      </div>
      <div className="col-span-2">
        <CropsStatusChart statusData={statusData} />
      </div>
      <div className="col-span-full">
        <HarvestTimelineChart timelineData={timelineData} />
      </div>
    </div>
  );
}

export default DashboardLayout;
