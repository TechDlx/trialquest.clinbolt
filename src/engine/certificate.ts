import { finaleContent } from '@/content/finale';

export interface CertificateData {
  rank: string;
  rolesMastered: number;
  rolesTotal: number;
  threeStarLevels: number;
  years: number;
  costBillions: number;
  /** Shown only if the player opened Test Yourself at least once. */
  knowledgeLine?: string;
  date: string;
}

export const CERT_WIDTH = 1200;
export const CERT_HEIGHT = 800;

/** Draws the completion certificate. Returns false when the canvas has no 2D context (tests, old browsers). */
export function drawCertificate(canvas: HTMLCanvasElement, d: CertificateData): boolean {
  canvas.width = CERT_WIDTH;
  canvas.height = CERT_HEIGHT;
  const g = canvas.getContext('2d');
  if (!g) return false;
  const { title, subtitle, line, disclaimer } = finaleContent.certificate;

  // Background and frame
  const bg = g.createLinearGradient(0, 0, CERT_WIDTH, CERT_HEIGHT);
  bg.addColorStop(0, '#f0fdfa');
  bg.addColorStop(1, '#ccfbf1');
  g.fillStyle = bg;
  g.fillRect(0, 0, CERT_WIDTH, CERT_HEIGHT);
  g.strokeStyle = '#0f766e';
  g.lineWidth = 10;
  g.strokeRect(30, 30, CERT_WIDTH - 60, CERT_HEIGHT - 60);
  g.lineWidth = 2;
  g.strokeRect(48, 48, CERT_WIDTH - 96, CERT_HEIGHT - 96);

  // Capsule mark (Dose)
  g.fillStyle = '#0f766e';
  g.beginPath();
  g.roundRect(560, 80, 80, 36, 18);
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.roundRect(600, 80, 40, 36, [0, 18, 18, 0]);
  g.fill();

  g.textAlign = 'center';
  g.fillStyle = '#134e4a';
  g.font = 'bold 28px system-ui, sans-serif';
  g.fillText(subtitle.toUpperCase(), CERT_WIDTH / 2, 160);
  g.fillStyle = '#0f172a';
  g.font = 'bold 56px system-ui, sans-serif';
  g.fillText(title, CERT_WIDTH / 2, 230);

  g.fillStyle = '#334155';
  g.font = '26px system-ui, sans-serif';
  g.fillText(`This certifies that the holder, rank ${d.rank},`, CERT_WIDTH / 2, 300);
  g.fillText(line, CERT_WIDTH / 2, 340);
  g.fillStyle = '#0f766e';
  g.font = 'bold 44px system-ui, sans-serif';
  g.fillText(`${d.rolesMastered} of ${d.rolesTotal} roles`, CERT_WIDTH / 2, 410);

  g.fillStyle = '#334155';
  g.font = '24px system-ui, sans-serif';
  const stats = [
    `${d.threeStarLevels} three-star levels`,
    `Journey: ${d.years} years, about $${d.costBillions.toFixed(1)} billion`,
  ];
  if (d.knowledgeLine) stats.push(d.knowledgeLine);
  stats.forEach((s, i) => g.fillText(s, CERT_WIDTH / 2, 470 + i * 38));

  g.fillStyle = '#475569';
  g.font = '22px system-ui, sans-serif';
  g.fillText(d.date, CERT_WIDTH / 2, 640);
  g.font = '16px system-ui, sans-serif';
  g.fillStyle = '#64748b';
  g.fillText(disclaimer, CERT_WIDTH / 2, 730);
  return true;
}

/** Saves the canvas as a PNG through a download link. Resolves false if the browser cannot export. */
export function saveCertificate(
  canvas: HTMLCanvasElement,
  filename = 'trial-quest-certificate.png',
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve(true);
      }, 'image/png');
    } catch {
      resolve(false);
    }
  });
}
