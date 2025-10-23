import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import type { Report } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ReportCardProps {
  report: Report;
  onClick?: () => void;
  showAllDetails?: boolean;
}

export function ReportCard({ report, onClick, showAllDetails = false }: ReportCardProps) {
  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "M월 d일 HH:mm", { locale: ko });
  };

  return (
    <Card 
      className={`transition-all ${onClick ? 'cursor-pointer hover-elevate active-elevate-2' : ''}`}
      onClick={onClick}
      data-testid={`card-report-${report.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-mono font-semibold text-base" data-testid={`text-container-${report.id}`}>
              {report.containerNo}
            </p>
            <p className="text-sm text-muted-foreground font-mono" data-testid={`text-bl-${report.id}`}>
              {report.blNo}
            </p>
          </div>
          <StatusBadge status={report.status as any} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Driver Section */}
        <div className="bg-chart-3/5 rounded-md p-3 space-y-1">
          <p className="text-xs font-semibold text-chart-3">
            운송기사: {report.driverName} ({report.vehicleNo})
          </p>
          <p className="text-xs text-foreground line-clamp-2">
            {report.driverDamage}
          </p>
          {report.driverSubmittedAt && (
            <p className="text-xs text-muted-foreground">
              제출: {formatDateTime(report.driverSubmittedAt)}
            </p>
          )}
        </div>

        {/* Rejection Section */}
        {report.status === 'rejected' && report.rejectionReason && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3 space-y-1">
            <p className="text-xs font-semibold text-destructive">반려 사유:</p>
            <p className="text-xs text-destructive/90">{report.rejectionReason}</p>
          </div>
        )}

        {/* Field Section */}
        {report.fieldStaff && showAllDetails && (
          <div className="bg-chart-2/5 rounded-md p-3 space-y-1">
            <p className="text-xs font-semibold text-chart-2">
              현장: {report.fieldStaff}
            </p>
            <p className="text-xs text-foreground line-clamp-2">
              {report.fieldDamage}
            </p>
            {report.fieldSubmittedAt && (
              <p className="text-xs text-muted-foreground">
                확인: {formatDateTime(report.fieldSubmittedAt)}
              </p>
            )}
          </div>
        )}

        {/* Office Section */}
        {report.officeStaff && showAllDetails && (
          <div className="bg-chart-1/5 rounded-md p-3 space-y-1">
            <p className="text-xs font-semibold text-chart-1">
              사무실: {report.officeStaff}
            </p>
            <p className="text-xs text-foreground line-clamp-2">
              {report.officeDamage}
            </p>
            {report.completedAt && (
              <p className="text-xs text-muted-foreground">
                승인: {formatDateTime(report.completedAt)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
