import React, { useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
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
import { useTranslation } from "react-i18next";
import { ShareRunModalProps } from "@/interfaces/share-run-modal";
import { buildRoute, CARD_W, MAP_H, ORANGE, OG_LITE, BG_MAP, BG_STAT } from "@/utils/share-run";
import { ShareRunModalStyles as styles } from "@/styles/share-run-modal.styles";
import { formatDuration, formatPace } from "@/utils/tabs";
import { useColors } from "@/hooks/use-colors";

export function ShareRunModal({ run, visible, onClose }: ShareRunModalProps) {
  const { t } = useTranslation();
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
        dialogTitle: t("share_dialog_title"),
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
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
          {t("share_modal_title")}
        </Text>

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
                    {t("share_route_unavailable")}
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

                {/* Marca d'água: Dri GoRun (nome do produto — não se traduz) */}
                <SvgText x={16} y={30} fill="#fff" fontSize={15} fontWeight="700" opacity={0.95}>
                  Dri GoRun
                </SvgText>

                {/* Distância total (canto superior direito) */}
                <SvgText x={CARD_W - 16} y={30} fill={ORANGE} fontSize={26} fontWeight="700" textAnchor="end">
                  {distKm}
                </SvgText>
                <SvgText x={CARD_W - 18} y={44} fill="rgba(255,255,255,0.38)" fontSize={11} textAnchor="end">
                  {t("share_km_label")}
                </SvgText>
              </Svg>

              {/* Separador */}
              <View style={{ height: 0.5, backgroundColor: "rgba(255,255,255,0.07)" }} />

              {/* Faixa de estatísticas */}
              <View style={{ backgroundColor: BG_STAT, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16 }}>
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{timeStr}</Text>
                    <Text style={styles.statLabel}>{t("tracking_time")}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{paceStr}</Text>
                    <Text style={styles.statLabel}>{t("tracking_pace")}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{run.calories}</Text>
                    <Text style={styles.statLabel}>{t("tracking_calories")}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>{date}</Text>
                  {/* Nome do produto em caixa alta — não se traduz */}
                  <Text style={styles.brandText}>DRI GORUN</Text>
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
