import { Card } from "@/components/ui/Card";

interface AdLimitNoticeProps {
  message: string;
}

export function AdLimitNotice({ message }: AdLimitNoticeProps) {
  return (
    <Card className="border-primary/30 bg-primary/5 p-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary">
            Aktif İlan Limiti
          </p>
          <p className="mt-1 text-sm leading-relaxed text-cream/85">
            {message}
          </p>
        </div>
      </div>
    </Card>
  );
}
