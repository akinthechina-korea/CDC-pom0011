import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: ReportStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    draft: { label: "작성중", className: "bg-muted text-muted-foreground" },
    driver_submitted: { label: "현장대기", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" },
    field_submitted: { label: "사무실대기", className: "bg-chart-1/10 text-chart-1 border-chart-1/20" },
    rejected: { label: "반려됨", className: "bg-destructive/10 text-destructive border-destructive/20" },
    completed: { label: "완료", className: "bg-chart-4/10 text-chart-4 border-chart-4/20" },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} font-medium`}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
