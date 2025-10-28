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
import { FileText, ArrowLeft, CheckCircle, Download, XCircle, AlertCircle } from "lucide-react";
import { ReportCard } from "@/components/ReportCard";
import SignatureCanvas from "@/components/SignatureCanvas";
import { ImageViewer } from "@/components/ImageViewer";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import type { Report, OfficeStaff } from "@shared/schema";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface OfficeDashboardProps {
  officeName: string;
  officePhone: string;
  reports: Report[];
  officeStaffList: OfficeStaff[];
  onLogout: () => void;
  onApprove: (reportId: string, data: {
    officeStaff: string;
    officePhone: string;
    officeDamage: string;
    officeSignature: string;
  }) => void;
  onReject: (reportId: string, reason: string, officeStaff: string) => void;
  onDownloadReport: (reportId: string) => void;
}

export default function OfficeDashboard({
  officeName,
  officePhone,
  reports,
  officeStaffList,
  onLogout,
  onApprove,
  onReject,
  onDownloadReport,
}: OfficeDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const { toast } = useToast();

  const DEFAULT_OFFICE_DAMAGE = "당사 작업 중 이상은 없음을 알려드리며, 이상 내용 확인 부탁드립니다.";

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "";
    return format(new Date(date), "yyyy-MM-dd HH:mm", { locale: ko });
  };

  const [formData, setFormData] = useState({
    officeDamage: DEFAULT_OFFICE_DAMAGE,
    officeSignature: "",
    rejectionReason: "",
  });

  const resetForm = () => {
    setFormData({
      officeDamage: DEFAULT_OFFICE_DAMAGE,
      officeSignature: "",
      rejectionReason: "",
    });
  };

  const handleApprove = () => {
    if (!selectedReport || !formData.officeDamage || !formData.officeSignature) {
      toast({
        title: "입력 오류",
        description: "모든 필수 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onApprove(selectedReport.id, {
      officeStaff: officeName,
      officePhone: officePhone,
      officeDamage: formData.officeDamage,
      officeSignature: formData.officeSignature,
    });

    setIsApproving(false);
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

    onReject(selectedReport.id, formData.rejectionReason, officeName);
    setIsRejecting(false);
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
    <div className="min-h-screen bg-office/5 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-office/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-office" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-lg text-foreground" data-testid="text-office-name">
                  {officeName}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{officePhone}</span>
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
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full mx-auto md:max-w-lg">
            <TabsTrigger value="pending" data-testid="tab-pending">
              승인대기 ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              승인완료 ({completedReports.length})
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

      {/* Reject Report Dialog */}
      <Dialog open={isRejecting} onOpenChange={(open) => {
        setIsRejecting(open);
        if (!open) {
          setSelectedReport(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>보고서 반려</DialogTitle>
            <DialogDescription>
              반려 사유를 입력하세요. 현장 책임자가 재검토합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">반려 사유 *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="예: 추가 확인 필요, 사진 불명확 등"
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
                  setIsApproving(true);
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

      {/* Approve Report Dialog */}
      <Dialog open={isApproving} onOpenChange={(open) => {
        setIsApproving(open);
        if (!open) {
          setSelectedReport(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>최종 승인</DialogTitle>
            <DialogDescription>
              기사 및 현장 보고 내용을 확인하고 최종 승인 의견을 작성하세요.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
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
                  <p className="text-sm text-muted-foreground">입고일자</p>
                  <p className="font-semibold">{selectedReport.reportDate}</p>
                </div>
              </div>

              {/* Driver Report */}
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

              {/* Field Report */}
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

              <Separator />

              {/* Office Approval Form */}
              <div className="space-y-4">
                <h3 className="font-semibold">사무실 최종 승인</h3>

                <div className="space-y-2 p-4 bg-chart-1/10 rounded-md">
                  <p className="text-sm font-medium">사무실 담당자</p>
                  <p className="text-base font-semibold">{officeName} ({officePhone})</p>
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

                <SignatureCanvas
                  onSignatureChange={(signature) => setFormData(prev => ({ ...prev, officeSignature: signature || "" }))}
                  label="서명 *"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={!formData.officeDamage || !formData.officeSignature}
                  className="flex-1 bg-chart-4 hover:bg-chart-4/90 text-white"
                  data-testid="button-approve"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  최종 승인
                </Button>
                <Button
                  onClick={() => {
                    setIsApproving(false);
                    setIsRejecting(true);
                  }}
                  variant="destructive"
                  data-testid="button-reject"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  반려
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
      <Dialog open={selectedReport !== null && !isApproving && !isRejecting} onOpenChange={(open) => !open && setSelectedReport(null)}>
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
                <div>
                  <p className="text-sm text-muted-foreground">기사 연락처</p>
                  <p className="font-semibold">{selectedReport.driverPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">입고일자</p>
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
                    {[...selectedReport.actionHistory].reverse().map((item, index) => {
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
