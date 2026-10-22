/**
 * Veri modu: VITE_USE_MOCKS=true → örnek (in-memory) veri;
 * false → gerçek backend (Lovable Cloud). Bileşenler bu bayrağı bilmez;
 * yalnızca /src/services altındaki fonksiyonlar dallanır.
 */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
