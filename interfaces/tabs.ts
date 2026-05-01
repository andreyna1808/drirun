import { RunRecord } from "@/context/AppContext";

export interface IMapViewProps {
  todayRun: RunRecord;
  type: "summary" | "home";
}