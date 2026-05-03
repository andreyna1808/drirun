export const MET_RUNNING = 8.0;

/**
 * Retorna a data no formato YYYY-MM-DD usando o fuso horário LOCAL do dispositivo.
 * Evita o bug de `toISOString()` que retorna UTC — em fusos negativos (ex: Brasil UTC-3),
 * correr às 22h local salva a data do dia SEGUINTE em UTC.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const haversineDistance =(
  lat1: number, lon1: number,
   lat2: number, lon2: number
): number => {
  const R = 6371000; // raio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const estimateCalories = (weightKg: number, durationSeconds: number, met = MET_RUNNING): number => {
  const hours = durationSeconds / 3600;
  return Math.round(met * weightKg * hours);
}
