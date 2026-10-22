/**
 * Entegrasyon gizli anahtarları: pgcrypto ile şifreli saklanır.
 * Şifreleme anahtarı yalnızca sunucu ortam değişkeninde (INTEGRATION_SECRET_KEY) yaşar;
 * istemci secret'ları ASLA okuyamaz (integration_secrets tablosunda authenticated izni yok).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

function encryptionKey(): string {
  const key = process.env["INTEGRATION_SECRET_KEY"];
  if (!key) throw new Error("INTEGRATION_SECRET_KEY tanımlı değil.");
  return key;
}

export async function storeSecret(admin: SupabaseClient, integrationId: string, key: string, value: string): Promise<void> {
  const { error } = await admin.rpc("store_integration_secret", {
    _integration_id: integrationId,
    _key: key,
    _value: value,
    _encryption_key: encryptionKey(),
  });
  if (error) throw new Error(`Secret saklanamadı: ${error.message}`);
}

export async function readSecret(admin: SupabaseClient, integrationId: string, key: string): Promise<string | null> {
  const { data, error } = await admin.rpc("read_integration_secret", {
    _integration_id: integrationId,
    _key: key,
    _encryption_key: encryptionKey(),
  });
  if (error) throw new Error(`Secret okunamadı: ${error.message}`);
  return (data as string | null) ?? null;
}

export async function deleteSecrets(admin: SupabaseClient, integrationId: string): Promise<void> {
  const { error } = await admin.rpc("delete_integration_secrets", { _integration_id: integrationId });
  if (error) throw new Error(`Secret silinemedi: ${error.message}`);
}
