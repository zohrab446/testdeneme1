/**
 * Kişisel veri maskeleme — analize gönderilmeden ÖNCE uygulanır.
 * Telefon, TC kimlik no ve e-posta adreslerini maskeler.
 */

/** 11 haneli, ilk hanesi 0 olmayan sayılar TC adayıdır. */
function looksLikeTc(digits: string): boolean {
  return digits.length === 11 && digits[0] !== "0";
}

export function maskPii(text: string): string {
  return text
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "***@***.***")
    .replace(/(\+90[\s-]?|0)?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, "05** *** ** **")
    .replace(/\b\d{11}\b/g, (m) => (looksLikeTc(m) ? "***********" : m));
}

/** Yazar kimliğini tek yönlü hash'e çevirir; isim asla saklanmaz. */
export async function hashAuthor(author: string): Promise<string> {
  const data = new TextEncoder().encode(author.trim().toLocaleLowerCase("tr-TR"));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
