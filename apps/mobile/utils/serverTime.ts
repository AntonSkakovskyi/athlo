let serverOffset = 0;

export function calibrateServerTime(serverDateHeader: string | undefined) {
  if (!serverDateHeader) return;
  const serverMs = new Date(serverDateHeader).getTime();
  if (isNaN(serverMs)) return;
  serverOffset = serverMs - Date.now();
}

export function serverNow(): number {
  return Date.now() + serverOffset;
}
