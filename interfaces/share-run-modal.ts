import { RunRecord } from "@/interfaces/context";

export interface ShareRunModalProps {
  run: RunRecord;
  visible: boolean;
  onClose: () => void;
}

export interface RouteDrawData {
  path: string;
  start: { x: number; y: number };
  kmMarkers: Array<{ x: number; y: number; km: number }>;
}