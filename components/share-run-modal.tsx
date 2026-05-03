import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { RunRecord } from "@/interfaces/context";
import { formatDuration, formatPace } from "@/utils/tabs";
import { haversineDistance } from "@/utils/tracking";
import { useColors } from "@/hooks/use-colors";

// ── Constantes visuais do card ─────────────────────────────────────────────
const CARD_W = 300;
const MAP_H = 290;
const ORANGE = "#FF6B35";
const OG_LITE = "#FBBF24";
const BG_MAP = "#06061a";
const BG_STAT = "#0d0d28";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Reduz o número de pontos para manter a path SVG pequena. */
function downsample(
  route: Array<{ latitude: number; longitude: number }>,
  max = 300
): Array<{ latitude: number; longitude: number }> {
  if (route.length <= max) return route;
  const step = Math.ceil(route.length / max);
  const out = route.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== route[route.length - 1]) out.push(route[route.length - 1]);
  return out;
}

/**
 * Normaliza as coordenadas GPS para o viewport do SVG, mantendo proporção.
 * Retorna a path SVG, o ponto inicial e marcadores de km.
 */
function buildRoute(rawRoute: Array<{ latitude: number; longitude: number }>) {
  const route = downsample(rawRoute);
  const empty = { path: "", start: { x: CARD_W / 2, y: MAP_H / 2 }, kmMarkers: [] as { x: number; y: number; km: number }[] };
  if (route.length < 2) return empty;

  const lats = route.map(p => p.latitude);
  const lngs = route.map(p => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latR = maxLat - minLat || 0.0005;
  const lngR = maxLng - minLng || 0.0005;

  const PAD = 30;
  const usableW = CARD_W - 2 * PAD;
  const usableH = MAP_H - 2 * PAD;
  const scale = Math.min(usableW / lngR, usableH / latR);
  const ox = PAD + (usableW - lngR * scale) / 2;
  const oy = PAD + (usableH - latR * scale) / 2;

  const xy = (p: { latitude: number; longitude: number }) => ({
    x: ox + (p.longitude - minLng) * scale,
    y: oy + (maxLat - p.latitude) * scale, // Y invertido: lat sobe, tela desce
  });

  const pts = route.map(xy);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Marca cada km completo ao longo da rota
  const kmMarkers: { x: number; y: number; km: number }[] = [];
  let cum = 0, nextKm = 1;
  for (let i = 1; i < route.length; i++) {
    cum += haversineDistance(
      route[i - 1].latitude, route[i - 1].longitude,
      route[i].latitude, route[i].longitude
    );
    if (cum >= nextKm * 1000) {
      kmMarkers.push({ ...pts[i], km: nextKm++ });
    }
  }

  return { path, start: pts[0], kmMarkers };
}

// ── Componente ─────────────────────────────────────────────────────────────

interface Props {
  run: RunRecord;
  visible: boolean;
  onClose: () => void;
}

export function ShareRunModal({ run, visible, onClose }: Props) {
  const colors = useColors();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const { path, start, kmMarkers } = buildRoute(run.route);
  const distKm = (run.distance / 1000).toFixed(2);
  const paceStr = formatPace(run.pace);
  const timeStr = formatDuration(run.duration);
  const date = new Date(run.date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });

  async function handleShare() {
    if (sharing) return;
    setSharing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    try {
      const uri = await captureRef(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",

      });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Compartilhar corrida – Dri GoRun",
      });
    } catch (e) {
      console.error("[Share] Erro ao compartilhar:", e);
    } finally {
      setSharing(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Backdrop semi-transparente — fecha ao clicar fora */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Bottom sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={styles.handle} />
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Compartilhar corrida</Text>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Card que será capturado como imagem ── */}
          <View style={styles.cardWrapper}>
            <View ref={cardRef} style={{ width: CARD_W, borderRadius: 16, overflow: "hidden" }}>

              {/* Área do mapa com rota SVG */}
              <Svg width={CARD_W} height={MAP_H} style={{ backgroundColor: BG_MAP }}>
                <Defs>
                  <LinearGradient id="rg" x1="0" y1="1" x2="1" y2="0">
                    <Stop offset="0" stopColor={ORANGE} stopOpacity="1" />
                    <Stop offset="1" stopColor={OG_LITE} stopOpacity="1" />
                  </LinearGradient>
                </Defs>

                {/* Grade de ruas muito apagada (privacidade) */}
                {[55, 100, 145, 190, 235, 280].map(v => (
                  <React.Fragment key={v}>
                    <Line x1={0} y1={v} x2={CARD_W} y2={v} stroke="#fff" strokeWidth={0.4} opacity={0.04} />
                    <Line x1={v} y1={0} x2={v} y2={MAP_H} stroke="#fff" strokeWidth={0.4} opacity={0.04} />
                  </React.Fragment>
                ))}

                {/* Rota */}
                {path ? (
                  <>
                    {/* Halo/brilho */}
                    <Path d={path} fill="none" stroke={ORANGE} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} />
                    {/* Linha principal */}
                    <Path d={path} fill="none" stroke="url(#rg)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <SvgText x={CARD_W / 2} y={MAP_H / 2} fill="rgba(255,255,255,0.2)" fontSize={13} textAnchor="middle">
                    rota não disponível
                  </SvgText>
                )}

                {/* Ponto de início */}
                <Circle cx={start.x} cy={start.y} r={10} fill={ORANGE} opacity={0.22} />
                <Circle cx={start.x} cy={start.y} r={5.5} fill={ORANGE} />
                <Circle cx={start.x} cy={start.y} r={2.5} fill="#fff" />

                {/* Marcadores de km */}
                {kmMarkers.map(m => (
                  <React.Fragment key={m.km}>
                    <Circle cx={m.x} cy={m.y} r={4} fill={OG_LITE} opacity={0.9} />
                    <SvgText x={m.x + 8} y={m.y - 3} fill={OG_LITE} fontSize={10} opacity={0.75}>
                      {m.km} km
                    </SvgText>
                  </React.Fragment>
                ))}

                {/* Marca d'água: Dri GoRun (canto superior esquerdo) */}
                <SvgText x={16} y={30} fill="#fff" fontSize={15} fontWeight="700" opacity={0.95}>
                  Dri GoRun?
                </SvgText>

                {/* Distância total (canto superior direito) */}
                <SvgText x={CARD_W - 16} y={28} fill={ORANGE} fontSize={26} fontWeight="700" textAnchor="end">
                  {distKm}
                </SvgText>
                <SvgText x={CARD_W - 10} y={42} fill="rgba(255,255,255,0.38)" fontSize={11} textAnchor="end">
                  km
                </SvgText>
              </Svg>

              {/* Separador */}
              <View style={{ height: 0.5, backgroundColor: "rgba(255,255,255,0.07)" }} />

              {/* Faixa de estatísticas */}
              <View style={{ backgroundColor: BG_STAT, paddingTop: 18, paddingBottom: 16 }}>
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{timeStr}</Text>
                    <Text style={styles.statLabel}>tempo</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{paceStr}</Text>
                    <Text style={styles.statLabel}>pace</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{run.calories}</Text>
                    <Text style={styles.statLabel}>kcal</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{date}</Text>
                  <Text style={styles.brandText}>DRI GORUN?</Text>
                </View>
              </View>

            </View>
          </View>

          <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-around", marginHorizontal: 16 }}>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: colors.primary, width: "45%", marginRight: 16 }, sharing && { opacity: 0.6 }]}
              onPress={handleShare}
              disabled={sharing}
              activeOpacity={0.8}
            >
              {sharing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.shareBtnText}>Compartilhar</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.surface, opacity: 0.7, width: "45%" }]} onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.closeBtnText, { color: colors.muted }]}>Fechar</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
