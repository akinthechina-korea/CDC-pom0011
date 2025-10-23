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
import { FileText, ArrowLeft, CheckCircle, Download } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { useToast } from "@/hooks/use-toast";
import type { Report, OfficeStaff } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface OfficeDashboardProps {
  reports: Report[];
  officeStaffList: OfficeStaff[];
  onBack: () => void;
  onApprove: (reportId: string, data: {
    officeStaff: string;
    officePhone: string;
    officeDamage: string;
    officeSignature: string;
  }) => void;
  onDownloadReport: (reportId: string) => void;
}

export default function OfficeDashboard({
  reports,
  officeStaffList,
  onBack,
  onApprove,
  onDownloadReport,
}: OfficeDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();

  const DEFAULT_OFFICE_DAMAGE = "현장 책임자의 서술에 동의합니다. 즉 천일과 관계없이 컨테이너 원래 부터 일부 파손등 이 있는걸 발견했습니다. 이미지 부착한대로.";

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "yyyy-MM-dd HH:mm", { locale: ko });
  };

  const [formData, setFormData] = useState({
    officeStaff: "",
    officePhone: "",
    officeDamage: DEFAULT_OFFICE_DAMAGE,
    officeSignature: "",
  });

  const resetForm = () => {
    setFormData({
      officeStaff: "",
      officePhone: "",
      officeDamage: DEFAULT_OFFICE_DAMAGE,
      officeSignature: "",
    });
  };

  const handleStaffSelect = (name: string) => {
    const staff = officeStaffList.find(s => s.name === name);
    if (staff) {
      setFormData(prev => ({
        ...prev,
        officeStaff: staff.name,
        officePhone: staff.phone,
      }));
    }
  };

  const handleApprove = () => {
    if (!selectedReport || !formData.officeStaff || !formData.officeDamage || !formData.officeSignature) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onApprove(selectedReport.id, {
      officeStaff: formData.officeStaff,
      officePhone: formData.officePhone,
      officeDamage: formData.officeDamage,
      officeSignature: formData.officeSignature,
    });

    setIsApproving(false);
    setSelectedReport(null);
    resetForm();
  };

  // 승인 대기: 현장 확인 시간 기준 최신순
  const pendingReports = reports
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

  return (
    <div className="min-h-screen bg-office/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-office/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-office" />
              </div>
              <div>
                <h1 className="font-semibold text-lg" data-testid="text-office-title">
                  사무실 책임자
                </h1>
                <p className="text-sm text-muted-foreground">최종 승인 및 문서 생성</p>
              </div>
            </div>
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              역할 선택
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending" data-testid="tab-pending">
              승인 대기 ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              승인 완료 ({completedReports.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Reports */}
          <TabsContent value="pending" className="space-y-4">
            {pendingReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">승인 대기 중인 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => {
                      setSelectedReport(report);
                      setIsApproving(true);
                    }}
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
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
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
        </Tabs>
      </main>

      {/* Approve Report Dialog */}
      <Dialog open={isApproving} onOpenChange={setIsApproving}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>최종 승인</DialogTitle>
            <DialogDescription>
              기사 및 현장 보고 내용을 확인하고 최종 승인 의견을 작성하세요.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Report Summary */}
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

              {/* Driver Report */}
              <Card className="bg-chart-3/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">기사 보고 내용</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="whitespace-pre-wrap text-sm bg-background/50 p-3 rounded-md">
                    {selectedReport.driverDamage}
                  </p>
                  <p className="text-sm text-muted-foreground">서명: {selectedReport.driverSignature}</p>
                </CardContent>
              </Card>

              {/* Field Report */}
              {selectedReport.fieldStaff && (
                <Card className="bg-chart-2/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">현장 확인 내용</CardTitle>
                    <CardDescription>{selectedReport.fieldStaff}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="whitespace-pre-wrap text-sm bg-background/50 p-3 rounded-md">
                      {selectedReport.fieldDamage}
                    </p>
                    <p className="text-sm text-muted-foreground">서명: {selectedReport.fieldSignature}</p>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Office Approval Form */}
              <div className="space-y-4">
                <h3 className="font-semibold">사무실 최종 승인</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="office-staff">사무실 담당자 *</Label>
                    <Select
                      value={formData.officeStaff}
                      onValueChange={handleStaffSelect}
                    >
                      <SelectTrigger id="office-staff" data-testid="select-office-staff">
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {officeStaffList.map((staff) => (
                          <SelectItem key={staff.id} value={staff.name}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="office-phone">연락처</Label>
                    <Input
                      id="office-phone"
                      value={formData.officePhone}
                      readOnly
                      className="bg-muted"
                      data-testid="input-office-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office-damage">사무실 확인 내용 *</Label>
                  <Textarea
                    id="office-damage"
                    placeholder="최종 확인 의견을 기록하세요..."
                    value={formData.officeDamage}
                    onChange={(e) => setFormData(prev => ({ ...prev, officeDamage: e.target.value }))}
                    className="min-h-32"
                    data-testid="textarea-office-damage"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="office-signature">서명 (이름) *</Label>
                  <Input
                    id="office-signature"
                    placeholder="이름을 입력하세요"
                    value={formData.officeSignature}
                    onChange={(e) => setFormData(prev => ({ ...prev, officeSignature: e.target.value }))}
                    data-testid="input-office-signature"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={!formData.officeStaff || !formData.officeDamage || !formData.officeSignature}
                  className="flex-1 bg-chart-4 hover:bg-chart-4/90 text-white"
                  data-testid="button-approve"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  최종 승인
                </Button>
                <Button
                  onClick={() => {
                    setIsApproving(false);
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

      {/* View Completed Report Dialog */}
      <Dialog open={selectedReport !== null && !isApproving} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>승인 완료 보고서</DialogTitle>
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

              <Button
                onClick={() => onDownloadReport(selectedReport.id)}
                className="w-full"
                data-testid="button-download"
              >
                <Download className="w-4 h-4 mr-2" />
                확인서 다운로드
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
