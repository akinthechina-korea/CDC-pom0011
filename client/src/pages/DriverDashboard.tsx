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
import { Truck, Plus, ArrowLeft, Download, AlertCircle } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import { PhotoUploader } from "@/components/PhotoUploader";
import SignatureCanvas from "@/components/SignatureCanvas";
import { ImageViewer } from "@/components/ImageViewer";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import type { Report, Cargo } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface DriverDashboardProps {
  driverName: string;
  vehicleNo: string;
  driverPhone: string;
  reports: Report[];
  cargoList: Cargo[];
  onLogout: () => void;
  onCreateReport: (data: {
    reportDate: string;
    containerNo: string;
    blNo: string;
    driverDamage: string;
    driverSignature: string;
    damagePhotos?: string[];
  }) => void;
  onUpdateReport: (reportId: string, data: {
    driverDamage: string;
    driverSignature: string;
    damagePhotos?: string[];
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
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { toast } = useToast();

  const DEFAULT_DRIVER_DAMAGE = "기사인 저가 현장에서 체크후 천일과 관계없이 컨테이너 원래 부터 일부 파손등 이 있는걸 발견했습니다. 이미지 부착한대로.";
  
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "yyyy-MM-dd HH:mm", { locale: ko });
  };

  const [formData, setFormData] = useState({
    reportDate: getTodayDate(),
    containerNo: "",
    blNo: "",
    driverDamage: DEFAULT_DRIVER_DAMAGE,
    driverSignature: "",
    damagePhotos: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      reportDate: getTodayDate(),
      containerNo: "",
      blNo: "",
      driverDamage: DEFAULT_DRIVER_DAMAGE,
      driverSignature: "",
      damagePhotos: [],
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
      damagePhotos: formData.damagePhotos,
    });
    setIsEditing(false);
    setSelectedReport(null);
    resetForm();
  };

  const myReports = reports.filter(r => r.vehicleNo === vehicleNo);
  
  // 검토 대기: 기사 제출 시간 기준 최신순 (새 제출 + 사무실 반려)
  const pendingReviewReports = myReports
    .filter(r => r.status === 'driver_submitted')
    .sort((a, b) => {
      const timeA = a.driverSubmittedAt ? new Date(a.driverSubmittedAt).getTime() : 0;
      const timeB = b.driverSubmittedAt ? new Date(b.driverSubmittedAt).getTime() : 0;
      return timeB - timeA;
    });
  
  // 검토 완료: 현장 확인 시간 기준 최신순
  const reviewedReports = myReports
    .filter(r => r.status === 'field_submitted')
    .sort((a, b) => {
      const timeA = a.fieldSubmittedAt ? new Date(a.fieldSubmittedAt).getTime() : 0;
      const timeB = b.fieldSubmittedAt ? new Date(b.fieldSubmittedAt).getTime() : 0;
      return timeB - timeA;
    });
  
  // 승인 완료: 최종 승인 시간 기준 최신순
  const completedReports = myReports
    .filter(r => r.status === 'completed')
    .sort((a, b) => {
      const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });
  
  // 반려: 반려 시간 기준 최신순
  const rejectedReports = myReports
    .filter(r => r.status === 'rejected')
    .sort((a, b) => {
      const timeA = a.rejectedAt ? new Date(a.rejectedAt).getTime() : 0;
      const timeB = b.rejectedAt ? new Date(b.rejectedAt).getTime() : 0;
      return timeB - timeA;
    });

  return (
    <div className="min-h-screen bg-driver/5 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-driver/10 flex items-center justify-center">
                <Truck className="w-5 h-5 text-driver" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-lg text-foreground" data-testid="text-driver-name">
                  {driverName}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{vehicleNo}</span>
                  <span>•</span>
                  <span>{driverPhone}</span>
                </div>
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:mx-auto md:max-w-3xl">
              <TabsTrigger value="pending-review" data-testid="tab-pending-review">
                검토대기 ({pendingReviewReports.length})
              </TabsTrigger>
              <TabsTrigger value="reviewed" data-testid="tab-reviewed">
                승인대기 ({reviewedReports.length})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">
                승인완료 ({completedReports.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                반려 ({rejectedReports.length})
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-driver hover:bg-driver/90 text-driver-foreground w-full sm:w-auto"
              data-testid="button-create-report"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 보고서 작성
            </Button>
          </div>

          {/* Pending Review Reports */}
          <TabsContent value="pending-review" className="space-y-4">
            {pendingReviewReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">검토 대기 중인 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReviewReports.map((report) => (
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

          {/* Reviewed Reports */}
          <TabsContent value="reviewed" className="space-y-4">
            {reviewedReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">검토 완료/승인 대기 중인 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviewedReports.map((report) => (
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
                  <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
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
            {rejectedReports.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/5 mb-4">
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

            {rejectedReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">반려된 보고서가 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() => {
                      setSelectedReport(report);
                      setFormData({
                        reportDate: report.reportDate,
                        containerNo: report.containerNo,
                        blNo: report.blNo,
                        driverDamage: report.driverDamage,
                        driverSignature: report.driverSignature,
                        damagePhotos: report.damagePhotos || [],
                      });
                      setIsEditing(true);
                    }}
                    showAllDetails={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Report Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => {
        setIsCreating(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 보고서 작성</DialogTitle>
            <DialogDescription>
              컨테이너 파손 내용을 상세히 기록해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportDate">화물 일자 *</Label>
              <Input
                id="reportDate"
                type="date"
                value={formData.reportDate}
                onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                data-testid="input-report-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="container">컨테이너 번호 *</Label>
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
                      {cargo.containerNo}
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
              <Label>파손 사진</Label>
              <PhotoUploader
                photos={formData.damagePhotos}
                onChange={(photos) => setFormData(prev => ({ ...prev, damagePhotos: photos }))}
                maxPhotos={10}
              />
            </div>

            <SignatureCanvas
              onSignatureChange={(signature) => setFormData(prev => ({ ...prev, driverSignature: signature || "" }))}
              label="서명 *"
            />

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
      <Dialog open={isEditing} onOpenChange={(open) => {
        setIsEditing(open);
        if (!open) {
          setSelectedReport(null);
          resetForm();
        }
      }}>
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
                <div>
                  <p className="text-sm text-muted-foreground">화물 일자</p>
                  <p className="font-semibold">{selectedReport.reportDate}</p>
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
                <Label>파손 사진 (수정)</Label>
                <PhotoUploader
                  photos={formData.damagePhotos}
                  onChange={(photos) => setFormData(prev => ({ ...prev, damagePhotos: photos }))}
                  maxPhotos={10}
                />
              </div>

              <SignatureCanvas
                onSignatureChange={(signature) => setFormData(prev => ({ ...prev, driverSignature: signature || "" }))}
                label="서명 (재제출) *"
              />

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
                <div>
                  <p className="text-sm text-muted-foreground">기사 연락처</p>
                  <p className="font-semibold">{selectedReport.driverPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">화물 일자</p>
                  <p className="font-semibold">{selectedReport.reportDate}</p>
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
                  {selectedReport.damagePhotos && selectedReport.damagePhotos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">파손 사진:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {selectedReport.damagePhotos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setViewerImages(selectedReport.damagePhotos || []);
                              setViewerOpen(true);
                            }}
                            className="relative aspect-square rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                            data-testid={`photo-thumbnail-${index}`}
                          >
                            <img
                              src={photo}
                              alt={`파손 사진 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedReport.driverSignature && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">서명:</p>
                      <img 
                        src={selectedReport.driverSignature} 
                        alt="기사 서명" 
                        className="h-16 max-w-[200px] border rounded bg-white p-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedReport.status === 'rejected' && selectedReport.rejectionReason && (
                <Card className="bg-destructive/5 border border-destructive/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-destructive">반려 사유</CardTitle>
                    {selectedReport.rejectedAt && (
                      <CardDescription className="text-xs">
                        반려: {formatDateTime(selectedReport.rejectedAt)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-destructive/90">{selectedReport.rejectionReason}</p>
                  </CardContent>
                </Card>
              )}

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
                      담당: {selectedReport.fieldStaff}
                    </p>
                    {selectedReport.fieldSignature && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">서명:</p>
                        <img 
                          src={selectedReport.fieldSignature} 
                          alt="현장 서명" 
                          className="h-16 max-w-[200px] border rounded bg-white p-1"
                        />
                      </div>
                    )}
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
                      담당: {selectedReport.officeStaff}
                    </p>
                    {selectedReport.officeSignature && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">서명:</p>
                        <img 
                          src={selectedReport.officeSignature} 
                          alt="사무실 서명" 
                          className="h-16 max-w-[200px] border rounded bg-white p-1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action History Section */}
              {selectedReport.actionHistory && selectedReport.actionHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">전체 처리 이력</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedReport.actionHistory.map((item, index) => {
                      const isRejection = item.actionType === 'reject' || item.actionType === 'office_reject';
                      const isSubmission = item.actionType === 'submit' || item.actionType === 'resubmit';
                      const isApproval = item.actionType === 'approve' || item.actionType === 'office_approve';
                      
                      let bgClass = 'bg-muted/30';
                      let roleLabel = '';
                      
                      if (item.actorRole === 'driver') {
                        bgClass = 'bg-chart-3/10';
                        roleLabel = '운송기사';
                      } else if (item.actorRole === 'field') {
                        bgClass = 'bg-chart-2/10';
                        roleLabel = '현장';
                      } else if (item.actorRole === 'office') {
                        bgClass = 'bg-chart-1/10';
                        roleLabel = '사무실';
                      }
                      
                      const actionLabel = {
                        submit: '제출',
                        resubmit: '재제출',
                        approve: '승인',
                        reject: '반려',
                        office_approve: '최종 승인',
                        office_reject: '반려',
                      }[item.actionType] || item.actionType;
                      
                      return (
                        <div key={index} className={`p-3 rounded-md ${bgClass}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm ${isRejection ? 'text-destructive' : isApproval ? 'text-chart-4' : 'text-foreground'}`}>
                                {roleLabel} {actionLabel}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({item.actor})
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(item.timestamp)}
                            </span>
                          </div>
                          
                          {item.content && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                {isSubmission ? '파손 내용:' : '확인 내용:'}
                              </p>
                              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                            </div>
                          )}
                          
                          {item.signature && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">서명:</p>
                              <img 
                                src={item.signature} 
                                alt="서명" 
                                className="h-16 max-w-[200px] border rounded bg-white p-1"
                              />
                            </div>
                          )}
                          
                          {item.reason && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-destructive/80 mb-1">반려 사유:</p>
                              <p className="text-sm text-destructive/90">{item.reason}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
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

      {/* Image Viewer */}
      <ImageViewer
        images={viewerImages}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      <Footer />
    </div>
  );
}
