import { RunRecord } from "./context";

export interface IMapViewProps {
  todayRun: RunRecord;
  type: "summary" | "home";
}