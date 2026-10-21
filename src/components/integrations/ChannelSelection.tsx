import { ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { IntegrationConnection } from "@/types/integrations";

export function ChannelSelection({ source, selected, onChange, disabled = false }: {
  source: IntegrationConnection; selected: string[]; onChange: (ids: string[]) => void; disabled?: boolean;
}) {
  if (!source.channels.length) return null;
  return <section className="space-y-3">
    <h3 className="text-sm font-medium">Taranacak kanallar</h3>
    <div className="grid gap-2 sm:grid-cols-2">
      {source.channels.map(channel => <Label key={channel.id} htmlFor={`channel-${source.id}-${channel.id}`} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border p-3 font-normal">
        <Checkbox id={`channel-${source.id}-${channel.id}`} disabled={disabled} checked={selected.includes(channel.id)}
          onCheckedChange={checked => onChange(checked === true ? [...selected, channel.id] : selected.filter(id => id !== channel.id))} />
        <span className="truncate"># {channel.name}</span>
      </Label>)}
    </div>
    <p className="flex gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-success" />Özel mesajlar asla okunmaz. Yalnızca seçili herkese açık kanallar taranır.</p>
  </section>;
}