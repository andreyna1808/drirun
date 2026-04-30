/** Calcula o dia atual da meta (quantos dias ja foram concluidos) */
export const getCurrentGoalDay = (runs: any[], goalStartDate: string | null): number => {
  if (!goalStartDate) return 0;
  const start = new Date(goalStartDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(diff + 1, runs.length);
}
