import { RouteDrawData } from "@/interfaces/share-run-modal";
import { haversineDistance } from "@/utils/tracking";

export const CARD_W = 300;
export const MAP_H = 290;
export const ORANGE = "#FF8C5A";
export const OG_LITE = "#FBBF24";
export const BG_MAP = "#06061a";
export const BG_STAT = "#0d0d28";

/** Reduz o número de pontos para manter a path SVG pequena. */
export function downsample(
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
export function buildRoute(
  rawRoute: Array<{ latitude: number; longitude: number }>
): RouteDrawData {
  const route = downsample(rawRoute);
  const empty: RouteDrawData = {
    path: "",
    start: { x: CARD_W / 2, y: MAP_H / 2 },
    kmMarkers: [],
  };
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
  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Marca cada km completo ao longo da rota
  const kmMarkers: Array<{ x: number; y: number; km: number }> = [];
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
