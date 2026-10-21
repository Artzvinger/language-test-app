export function formatTimeSpent(seconds?: number): string {
  if (seconds === undefined || seconds === null) return 'н/д'

  if (seconds < 60) {
    return `${seconds} сек.`
  }

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return secs > 0 ? `${mins} мин. ${secs} сек.` : `${mins} мин.`
}
