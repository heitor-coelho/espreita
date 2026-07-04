const EXTENSOES_VIDEO = new Set(["mp4", "mov", "webm"]);

export function arquivoEhVideo(url: string): boolean {
  const extensao = url.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSOES_VIDEO.has(extensao);
}
