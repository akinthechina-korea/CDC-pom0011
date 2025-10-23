import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, ArrowLeft, CheckCircle, XCircle, Download } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { useToast } from "@/hooks/use-toast";
import type { Report, FieldStaff } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface FieldDashboardProps {
  fieldName: string;
  fieldPhone: string;
  reports: Report[];
  fieldStaffList: FieldStaff[];
  onLogout: () => void;
  onApprove: (reportId: string, data: {
    fieldStaff: string;
    fieldPhone: string;
    fieldDamage: string;
    fieldSignature: string;
  }) => void;
  onReject: (reportId: string, reason: string) => void;
  onDownloadReport: (reportId: string) => void;
}

export default function FieldDashboard({
  fieldName,
  fieldPhone,
  reports,
  fieldStaffList,
  onLogout,
  onApprove,
  onReject,
  onDownloadReport,
}: FieldDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { toast } = useToast();

  const DEFAULT_FIELD_DAMAGE = "현장 책임자인 저가 체크후 기사님 서술과 일치합니다. 즉 천일과 관계없이 컨테이너 원래 부터 일부 파손등 이 있는걸 발견했습니다. 이미지 부착한대로.";

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "yyyy-MM-dd HH:mm", { locale: ko });
  };

  const [formData, setFormData] = useState({
    fieldStaff: "",
    fieldPhone: "",
    fieldDamage: DEFAULT_FIELD_DAMAGE,
    fieldSignature: "",
    rejectionReason: "",
  });

  const resetForm = () => {
    setFormData({
      fieldStaff: "",
      fieldPhone: "",
      fieldDamage: DEFAULT_FIELD_DAMAGE,
      fieldSignature: "",
      rejectionReason: "",
    });
  };

  const handleStaffSelect = (name: string) => {
    const staff = fieldStaffList.find(s => s.name === name);
    if (staff) {
      setFormData(prev => ({
        ...prev,
        fieldStaff: staff.name,
        fieldPhone: staff.phone,
      }));
    }
  };

  const handleApprove = () => {
    if (!selectedReport || !formData.fieldStaff || !formData.fieldDamage || !formData.fieldSignature) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onApprove(selectedReport.id, {
      fieldStaff: formData.fieldStaff,
      fieldPhone: formData.fieldPhone,
      fieldDamage: formData.fieldDamage,
      fieldSignature: formData.fieldSignature,
    });

    setIsReviewing(false);
    setSelectedReport(null);
    resetForm();
  };

  const handleReject = () => {
    if (!selectedReport || !formData.rejectionReason) {
      toast({
        title: "입력 오류",
        description: "반려 사유를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onReject(selectedReport.id, formData.rejectionReason);
    setIsRejecting(false);
    setSelectedReport(null);
    resetForm();
  };

  // 검토 대기: 기사 제출 시간 기준 최신순
  const pendingReviewReports = reports
    .filter(r => r.status === 'driver_submitted')
    .sort((a, b) => {
      const timeA = a.driverSubmittedAt ? new Date(a.driverSubmittedAt).getTime() : 0;
      const timeB = b.driverSubmittedAt ? new Date(b.driverSubmittedAt).getTime() : 0;
      return timeB - timeA;
    });
  
  // 승인 대기: 현장 확인 시간 기준 최신순
  const pendingApprovalReports = reports
    .filter(r => r.status === 'field_submitted')
    .sort((a, b) => {
      const timeA = a.fieldSubmittedAt ? new Date(a.fieldSubmittedAt).getTime() : 0;
      const timeB = b.fieldSubmittedAt ? new Date(b.fieldSubmittedAt).getTime() : 0;
      return timeB - timeA;
    });
  
  // 승인 완료: 최종 승인 시간 기준 최신순
  const completedReports = reports
    .filter(r => r.status === 'completed')
    .sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });
  
  // 반려: 반려 시간 기준 최신순
  const rejectedReports = reports
    .filter(r => r.status === 'rejected')
    .sort((a, b) => {
      const timeA = a.rejectedAt ? new Date(a.rejectedAt).getTime() : 0;
      const timeB = b.rejectedAt ? new Date(b.rejectedAt).getTime() : 0;
      return timeB - timeA;
    });

  return (
    <div className="min-h-screen bg-field/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-field/10 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-field" />
              </div>
              <div>
                <h1 className="font-semibold text-lg" data-testid="text-field-title">
                  현장 책임자
                </h1>
                <p className="text-sm text-muted-foreground">
                  {fieldName} ({fieldPhone})
                </p>
              </div>
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              data-testid="button-logout"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Tabs defaultValue="pending-review" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="pending-review" data-testid="tab-pending-review">
              검토대기 ({pendingReviewReports.length})
            </TabsTrigger>
            <TabsTrigger value="pending-approval" data-testid="tab-pending-approval">
              승인대기 ({pendingApprovalReports.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              승인완료 ({completedReports.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              반려 ({rejectedReports.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Review Reports */}
          <TabsContent value="pending-review" className="space-y-4">
            {pendingReviewReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">검토 대기 중인 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReviewReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => {
                      setSelectedReport(report);
                      setIsReviewing(true);
                    }}
                    showAllDetails={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Approval Reports */}
          <TabsContent value="pending-approval" className="space-y-4">
            {pendingApprovalReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">승인 대기 중인 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingApprovalReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => setSelectedReport(report)}
                    showAllDetails={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Reports */}
          <TabsContent value="completed" className="space-y-4">
            {completedReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">승인 완료된 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => setSelectedReport(report)}
                    showAllDetails={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rejected Reports */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">반려된 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => setSelectedReport(report)}
                    showAllDetails={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Review Report Dialog */}
      <Dialog open={isReviewing} onOpenChange={setIsReviewing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>보고서 검토</DialogTitle>
            <DialogDescription>
              기사 보고 내용을 확인하고 현장 검토 의견을 작성하세요.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Driver Report */}
              <Card className="bg-chart-3/5">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-base">기사 보고 내용</CardTitle>
                      <CardDescription className="mt-1">
                        {selectedReport.driverName} ({selectedReport.vehicleNo})
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-mono font-semibold">{selectedReport.containerNo}</p>
                      <p className="text-muted-foreground font-mono">{selectedReport.blNo}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-1">파손 내용:</p>
                    <p className="whitespace-pre-wrap text-sm bg-background/50 p-3 rounded-md">
                      {selectedReport.driverDamage}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">서명: {selectedReport.driverSignature}</p>
                </CardContent>
              </Card>

              <Separator />

              {/* Field Review Form */}
              <div className="space-y-4">
                <h3 className="font-semibold">현장 검토 의견</h3>

                <div className="space-y-2">
                  <Label htmlFor="field-staff">현장 담당자 *</Label>
                  <Select
                    value={formData.fieldStaff}
                    onValueChange={handleStaffSelect}
                  >
                    <SelectTrigger id="field-staff" data-testid="select-field-staff">
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldStaffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.name}>
                          {staff.name} - {staff.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-damage">현장 확인 내용 *</Label>
                  <Textarea
                    id="field-damage"
                    placeholder="현장에서 확인한 파손 상태를 기록하세요..."
                    value={formData.fieldDamage}
                    onChange={(e) => setFormData(prev => ({ ...prev, fieldDamage: e.target.value }))}
                    className="min-h-32"
                    data-testid="textarea-field-damage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-signature">서명 (이름) *</Label>
                  <Input
                    id="field-signature"
                    placeholder="이름을 입력하세요"
                    value={formData.fieldSignature}
                    onChange={(e) => setFormData(prev => ({ ...prev, fieldSignature: e.target.value }))}
                    data-testid="input-field-signature"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={!formData.fieldStaff || !formData.fieldDamage || !formData.fieldSignature}
                  className="flex-1 bg-chart-4 hover:bg-chart-4/90 text-white"
                  data-testid="button-approve"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  승인
                </Button>
                <Button
                  onClick={() => {
                    setIsReviewing(false);
                    setIsRejecting(true);
                  }}
                  variant="destructive"
                  className="flex-1"
                  data-testid="button-reject-open"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  반려
                </Button>
                <Button
                  onClick={() => {
                    setIsReviewing(false);
                    setSelectedReport(null);
                    resetForm();
                  }}
                  variant="outline"
                  data-testid="button-cancel"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>보고서 반려</DialogTitle>
            <DialogDescription>
              반려 사유를 명확히 입력해주세요. 기사가 수정 후 재제출합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">반려 사유 *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="예: 파손 부위 사진 필요, 상세 설명 부족 등"
                value={formData.rejectionReason}
                onChange={(e) => setFormData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                className="min-h-24"
                data-testid="textarea-rejection"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                disabled={!formData.rejectionReason}
                variant="destructive"
                className="flex-1"
                data-testid="button-confirm-reject"
              >
                반려 확정
              </Button>
              <Button
                onClick={() => {
                  setIsRejecting(false);
                  setIsReviewing(true);
                }}
                variant="outline"
                data-testid="button-cancel-reject"
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Report Detail Dialog */}
      <Dialog open={selectedReport !== null && !isReviewing && !isRejecting} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>보고서 상세</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-md">
                <div>
                  <p className="text-sm text-muted-foreground">Container No.</p>
                  <p className="font-mono font-semibold">{selectedReport.containerNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">B/L No.</p>
                  <p className="font-mono font-semibold">{selectedReport.blNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">차량번호</p>
                  <p className="font-semibold">{selectedReport.vehicleNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">운송기사</p>
                  <p className="font-semibold">{selectedReport.driverName}</p>
                </div>
              </div>

              <Card className="bg-chart-3/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">기사 보고 내용</CardTitle>
                  {selectedReport.driverSubmittedAt && (
                    <CardDescription className="text-xs">
                      제출: {formatDateTime(selectedReport.driverSubmittedAt)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="whitespace-pre-wrap text-sm">{selectedReport.driverDamage}</p>
                  <p className="text-sm text-muted-foreground">서명: {selectedReport.driverSignature}</p>
                </CardContent>
              </Card>

              {selectedReport.fieldStaff && (
                <Card className="bg-chart-2/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">현장 확인 내용</CardTitle>
                    {selectedReport.fieldSubmittedAt && (
                      <CardDescription className="text-xs">
                        확인: {formatDateTime(selectedReport.fieldSubmittedAt)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="whitespace-pre-wrap text-sm">{selectedReport.fieldDamage}</p>
                    <p className="text-sm text-muted-foreground">
                      담당: {selectedReport.fieldStaff} | 서명: {selectedReport.fieldSignature}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedReport.officeStaff && (
                <Card className="bg-chart-1/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">사무실 확인 내용</CardTitle>
                    {selectedReport.completedAt && (
                      <CardDescription className="text-xs">
                        승인: {formatDateTime(selectedReport.completedAt)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="whitespace-pre-wrap text-sm">{selectedReport.officeDamage}</p>
                    <p className="text-sm text-muted-foreground">
                      담당: {selectedReport.officeStaff} | 서명: {selectedReport.officeSignature}
                    </p>
                  </CardContent>
                </Card>
              )}

              {selectedReport.status === 'completed' && (
                <Button
                  onClick={() => onDownloadReport(selectedReport.id)}
                  className="w-full"
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4 mr-2" />
                  확인서 다운로드
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
