import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { ClassifiedAdWithVendor, ListingAgentProfile } from "@/types/database";

interface BrokerContactCardProps {
  ad: ClassifiedAdWithVendor;
}

function resolveResponsibleAgent(
  ad: ClassifiedAdWithVendor
): ListingAgentProfile | null {
  return ad.broker ?? ad.owner ?? ad.vendor ?? null;
}

export function BrokerContactCard({ ad }: BrokerContactCardProps) {
  const agent = resolveResponsibleAgent(ad);
  const agentName = agent?.full_name?.trim() || "Luxury Broker";
  const agentEmail = agent?.email;
  const phone = ad.contact_phone;

  const contactHref = phone
    ? `tel:${phone.replace(/\s/g, "")}`
    : agentEmail
      ? `mailto:${agentEmail}?subject=${encodeURIComponent(`360desk İlan: ${ad.title}`)}`
      : undefined;

  const contactLabel = phone
    ? "Danışmanı Ara"
    : agentEmail
      ? "Danışmana Yaz"
      : "İletişim Bilgisi Yok";

  return (
    <Card className="flex flex-col gap-5 border-cream/10 bg-charcoal-light">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
          Sorumlu Danışman
        </p>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xl font-bold text-primary">
            {agentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-cream truncate">
              {agentName}
            </p>
            {agent?.company_name && (
              <p className="text-sm text-cream/50 truncate">
                {agent.company_name}
              </p>
            )}
            {agentEmail && (
              <p className="text-sm text-cream/40 truncate">{agentEmail}</p>
            )}
          </div>
        </div>
      </div>

      <div className="h-px bg-cream/10" />

      {phone && (
        <div className="flex items-center gap-3 text-sm text-cream/70">
          <svg
            className="h-4 w-4 shrink-0 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <span>{phone}</span>
        </div>
      )}

      {contactHref ? (
        <a href={contactHref} className="block">
          <Button className="w-full" size="lg">
            {contactLabel}
          </Button>
        </a>
      ) : (
        <Button className="w-full" size="lg" disabled>
          {contactLabel}
        </Button>
      )}

      <p className="text-xs text-center text-cream/30">
        Premium segment ilanlar için öncelikli danışman hattı.
      </p>
    </Card>
  );
}
