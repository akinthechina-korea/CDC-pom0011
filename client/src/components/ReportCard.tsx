import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import type { Report, ActionHistoryItem } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";

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

  const getActionLabel = (item: ActionHistoryItem) => {
    const labels = {
      submit: '제출',
      resubmit: '재제출',
      approve: '현장 승인',
      reject: '현장 반려',
      office_approve: '최종 승인',
      office_reject: '사무실 반려',
    };
    return labels[item.actionType] || item.actionType;
  };

  const getActionColor = (item: ActionHistoryItem) => {
    if (item.actionType === 'reject' || item.actionType === 'office_reject') {
      return 'text-destructive';
    }
    if (item.actionType === 'approve' || item.actionType === 'office_approve') {
      return 'text-chart-4';
    }
    return 'text-muted-foreground';
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
          {report.damagePhotos && report.damagePhotos.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
              <ImageIcon className="h-3 w-3" />
              <span>사진 {report.damagePhotos.length}장</span>
            </div>
          )}
        </div>

        {/* Action History Section */}
        {report.actionHistory && report.actionHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">처리 이력:</p>
            <div className="space-y-1.5">
              {report.actionHistory.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 text-xs p-2 bg-muted/30 rounded"
                >
                  {(item.actionType === 'reject' || item.actionType === 'office_reject') ? (
                    <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-destructive" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-chart-4" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium ${getActionColor(item)}`}>
                        {getActionLabel(item)}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {item.actor}
                    </p>
                    {item.reason && (
                      <p className="text-destructive/90 mt-1">
                        사유: {item.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
