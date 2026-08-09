import { Badge } from "@/components/ui/badge";

type ProtocolBadgeProps = {
  protocol: string;
  https?: boolean;
};

export function ProtocolBadge({ protocol, https }: ProtocolBadgeProps) {
  const normalized = protocol.toLowerCase();
  const variant =
    normalized === "socks5"
      ? "success"
      : normalized === "socks4"
        ? "warning"
        : "info";

  return (
    <Badge variant={variant} className="font-mono text-xs uppercase">
      {https && normalized.startsWith("http") ? "https" : normalized}
    </Badge>
  );
}

type AnonymityBadgeProps = {
  anonymity: string;
};

export function AnonymityBadge({ anonymity }: AnonymityBadgeProps) {
  const elite = anonymity === "elite";
  return (
    <Badge variant={elite ? "success" : "warning"} className="text-xs capitalize">
      {anonymity}
    </Badge>
  );
}
