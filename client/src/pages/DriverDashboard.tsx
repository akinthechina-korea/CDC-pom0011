import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Truck, Plus, ArrowLeft, Download, AlertCircle } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { useToast } from "@/hooks/use-toast";
import type { Report, Cargo } from "@shared/schema";

interface DriverDashboardProps {
  driverName: string;
  vehicleNo: string;
  driverPhone: string;
  reports: Report[];
  cargoList: Cargo[];
  onLogout: () => void;
  onCreateReport: (data: {
    containerNo: string;
    blNo: string;
    driverDamage: string;
    driverSignature: string;
  }) => void;
  onUpdateReport: (reportId: string, data: {
    driverDamage: string;
    driverSignature: string;
  }) => void;
  onDownloadReport: (reportId: string) => void;
}

export default function DriverDashboard({
  driverName,
  vehicleNo,
  driverPhone,
  reports,
  cargoList,
  onLogout,
  onCreateReport,
  onUpdateReport,
  onDownloadReport,
}: DriverDashboardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    containerNo: "",
    blNo: "",
    driverDamage: "",
    driverSignature: "",
  });

  const resetForm = () => {
    setFormData({
      containerNo: "",
      blNo: "",
      driverDamage: "",
      driverSignature: "",
    });
  };

  const handleContainerSelect = (containerNo: string) => {
    const cargo = cargoList.find(c => c.containerNo === containerNo);
    if (cargo) {
      setFormData(prev => ({
        ...prev,
        containerNo: cargo.containerNo,
        blNo: cargo.blNo,
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.driverDamage || !formData.driverSignature) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onCreateReport(formData);
    resetForm();
    setIsCreating(false);
  };

  const handleUpdate = () => {
    if (!selectedReport || !formData.driverDamage || !formData.driverSignature) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onUpdateReport(selectedReport.id, {
      driverDamage: formData.driverDamage,
      driverSignature: formData.driverSignature,
    });
    setIsEditing(false);
    setSelectedReport(null);
    resetForm();
  };

  const myReports = reports.filter(r => r.vehicleNo === vehicleNo);
  const rejectedReports = myReports.filter(r => r.status === 'rejected');
  const otherReports = myReports.filter(r => r.status !== 'rejected');

  return (
    <div className="min-h-screen bg-driver/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-driver/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-driver" />
              </div>
              <div>
                <h1 className="font-semibold text-lg" data-testid="text-driver-name">
                  {driverName}
                </h1>
                <p className="text-sm text-muted-foreground">{vehicleNo}</p>
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

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Create New Report Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">내 보고서</h2>
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-driver hover:bg-driver/90 text-driver-foreground"
            data-testid="button-create-report"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 보고서 작성
          </Button>
        </div>

        {/* Rejected Reports Alert */}
        {rejectedReports.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-base">반려된 보고서 {rejectedReports.length}건</CardTitle>
              </div>
              <CardDescription>
                아래 보고서를 수정하여 재제출해주세요.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Rejected Reports */}
        {rejectedReports.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-destructive">반려된 보고서</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => {
                    setSelectedReport(report);
                    setFormData({
                      containerNo: report.containerNo,
                      blNo: report.blNo,
                      driverDamage: report.driverDamage,
                      driverSignature: report.driverSignature,
                    });
                    setIsEditing(true);
                  }}
                  showAllDetails={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Reports */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">전체 보고서</h3>
          {otherReports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">아직 제출한 보고서가 없습니다.</p>
                <Button
                  onClick={() => setIsCreating(true)}
                  variant="outline"
                  className="mt-4"
                >
                  첫 보고서 작성하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => setSelectedReport(report)}
                  showAllDetails={true}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Report Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 보고서 작성</DialogTitle>
            <DialogDescription>
              컨테이너 파손 내용을 상세히 기록해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="container">컨테이너 번호</Label>
              <Select
                value={formData.containerNo}
                onValueChange={handleContainerSelect}
              >
                <SelectTrigger id="container" data-testid="select-container">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {cargoList.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.containerNo}>
                      {cargo.containerNo} - {cargo.blNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bl">B/L 번호</Label>
              <Input
                id="bl"
                value={formData.blNo}
                readOnly
                className="bg-muted"
                data-testid="input-bl"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="damage">파손 내용 *</Label>
              <Textarea
                id="damage"
                placeholder="파손 상태를 상세히 기록하세요..."
                value={formData.driverDamage}
                onChange={(e) => setFormData(prev => ({ ...prev, driverDamage: e.target.value }))}
                className="min-h-32"
                data-testid="textarea-damage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">서명 (이름) *</Label>
              <Input
                id="signature"
                placeholder="이름을 입력하세요"
                value={formData.driverSignature}
                onChange={(e) => setFormData(prev => ({ ...prev, driverSignature: e.target.value }))}
                data-testid="input-signature"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!formData.containerNo || !formData.driverDamage || !formData.driverSignature}
                className="flex-1 bg-driver hover:bg-driver/90 text-driver-foreground"
                data-testid="button-submit-report"
              >
                보고서 제출
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false);
                  resetForm();
                }}
                variant="outline"
                data-testid="button-cancel"
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>보고서 수정 및 재제출</DialogTitle>
            <DialogDescription>
              반려 사유를 확인하고 내용을 수정해주세요.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              {/* Rejection Reason */}
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-destructive">반려 사유</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedReport.rejectionReason}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>컨테이너 번호</Label>
                  <Input value={formData.containerNo} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>B/L 번호</Label>
                  <Input value={formData.blNo} readOnly className="bg-muted" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="edit-damage">파손 내용 (수정) *</Label>
                <Textarea
                  id="edit-damage"
                  placeholder="파손 상태를 상세히 기록하세요..."
                  value={formData.driverDamage}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverDamage: e.target.value }))}
                  className="min-h-32"
                  data-testid="textarea-edit-damage"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-signature">서명 (이름) *</Label>
                <Input
                  id="edit-signature"
                  placeholder="이름을 입력하세요"
                  value={formData.driverSignature}
                  onChange={(e) => setFormData(prev => ({ ...prev, driverSignature: e.target.value }))}
                  data-testid="input-edit-signature"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleUpdate}
                  disabled={!formData.driverDamage || !formData.driverSignature}
                  className="flex-1 bg-driver hover:bg-driver/90 text-driver-foreground"
                  data-testid="button-update-report"
                >
                  재제출
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedReport(null);
                    resetForm();
                  }}
                  variant="outline"
                  data-testid="button-cancel-edit"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Report Detail Dialog */}
      <Dialog open={selectedReport !== null && !isEditing} onOpenChange={(open) => !open && setSelectedReport(null)}>
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
