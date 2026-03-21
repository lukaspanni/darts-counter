import { toPng } from "html-to-image";

export async function captureAndShare(element: HTMLElement): Promise<void> {
  const dataUrl = await toPng(element, { pixelRatio: 2 });

  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], "match-result.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
  } else {
    downloadBlob(dataUrl);
  }
}

function downloadBlob(dataUrl: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "match-result.png";
  link.click();
}
