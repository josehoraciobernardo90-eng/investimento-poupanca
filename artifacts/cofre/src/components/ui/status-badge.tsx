import { cn } from "@/lib/utils";

type StatusType = "Ativo" | "Congelado" | "Atrasado" | "Liquidado" | "Pendente" | "Aprovado" | "Rejeitado" | string;

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  let colorClass = "bg-muted text-muted-foreground border-border";
  
  switch (status) {
    case "Ativo":
    case "Aprovado":
      colorClass = "bg-success/10 text-success border-success/20";
      break;
    case "Atrasado":
    case "Rejeitado":
      colorClass = "bg-destructive/10 text-destructive border-destructive/20";
      break;
    case "Congelado":
    case "Liquidado":
      colorClass = "bg-secondary text-secondary-foreground border-white/10";
      break;
    case "Pendente":
      colorClass = "bg-warning/10 text-warning border-warning/20";
      break;
  }

  return (
    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", colorClass, className)}>
      {status}
    </span>
  );
}
