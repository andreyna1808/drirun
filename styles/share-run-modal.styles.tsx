import { StyleSheet } from "react-native";
import { ORANGE } from "@/utils/share-run";

export const ShareRunModalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 0.5,
    paddingBottom: 40,
    maxHeight: "88%",
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: "rgba(128,128,128,0.35)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10, marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 17, fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
  },
  scroll: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  statsRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    width: "100%",
  },
  statCol: {
    flex: 1,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  statVal: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 8,
  },
  dateText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 11,
  },
  brandText: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  shareBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  shareBtnText: {
    color: "#ffffff",
    fontSize: 16, fontWeight: "600",
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 14,
  },
});
