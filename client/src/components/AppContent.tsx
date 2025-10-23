import { useState } from "react";
import RoleSelection from "@/pages/RoleSelection";
import DriverLogin from "@/pages/DriverLogin";
import DriverDashboard from "@/pages/DriverDashboard";
import FieldDashboard from "@/pages/FieldDashboard";
import OfficeDashboard from "@/pages/OfficeDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Report, Vehicle, Cargo, FieldStaff, OfficeStaff } from "@shared/schema";

type Role = '' | 'driver' | 'field' | 'office' | 'admin';

interface DriverSession {
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
}

export default function AppContent() {
  const [currentRole, setCurrentRole] = useState<Role>('');
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null);
  const { toast } = useToast();

  // Fetch master data
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/data/vehicles'],
  });

  const { data: cargoList = [] } = useQuery<Cargo[]>({
    queryKey: ['/api/data/cargo'],
  });

  const { data: fieldStaffList = [] } = useQuery<FieldStaff[]>({
    queryKey: ['/api/data/field-staff'],
  });

  const { data: officeStaffList = [] } = useQuery<OfficeStaff[]>({
    queryKey: ['/api/data/office-staff'],
  });

  // Fetch reports
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ['/api/reports'],
  });

  // Driver login mutation
  const driverLoginMutation = useMutation({
    mutationFn: async (data: { vehicleNo: string; password: string }) => {
      const res = await apiRequest('POST', '/api/auth/driver-login', data);
      return await res.json();
    },
    onSuccess: (data: { vehicleNo: string; driverName: string; driverPhone: string }) => {
      setDriverSession({
        vehicleNo: data.vehicleNo,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
      });
      toast({
        title: "로그인 성공",
        description: `${data.driverName}님, 환영합니다.`,
      });
    },
    onError: (error: any) => {
      const message = error?.message || "로그인에 실패했습니다";
      toast({
        title: "로그인 실패",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleDriverLogout = () => {
    setDriverSession(null);
    setCurrentRole('');
  };

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: {
      reportDate: string;
      containerNo: string;
      blNo: string;
      driverDamage: string;
      driverSignature: string;
      damagePhotos?: string[];
    }) => {
      if (!driverSession) throw new Error("No driver session");
      
      return await apiRequest('POST', '/api/reports', {
        ...data,
        vehicleNo: driverSession.vehicleNo,
        driverName: driverSession.driverName,
        driverPhone: driverSession.driverPhone,
        status: 'driver_submitted',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "보고서 제출 완료",
        description: "기사 보고서가 성공적으로 제출되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "제출 실패",
        description: "보고서 제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Update report mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, data }: {
      reportId: string;
      data: { driverDamage: string; driverSignature: string; damagePhotos?: string[] };
    }) => {
      return await apiRequest('PUT', `/api/reports/${reportId}/resubmit`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "재제출 완료",
        description: "보고서가 수정되어 재제출되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "재제출 실패",
        description: "보고서 재제출 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Field approve mutation
  const fieldApproveMutation = useMutation({
    mutationFn: async ({ reportId, data }: {
      reportId: string;
      data: {
        fieldStaff: string;
        fieldPhone: string;
        fieldDamage: string;
        fieldSignature: string;
      };
    }) => {
      return await apiRequest('PUT', `/api/reports/${reportId}/field-review`, { 
        ...data, 
        action: 'approve' 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "현장 승인 완료",
        description: "보고서가 현장에서 승인되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "승인 실패",
        description: "보고서 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Field reject mutation
  const fieldRejectMutation = useMutation({
    mutationFn: async ({ reportId, reason }: {
      reportId: string;
      reason: string;
    }) => {
      return await apiRequest('PUT', `/api/reports/${reportId}/field-review`, {
        action: 'reject',
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "보고서 반려",
        description: "보고서가 반려되었습니다. 기사가 수정 후 재제출할 수 있습니다.",
      });
    },
    onError: () => {
      toast({
        title: "반려 실패",
        description: "보고서 반려 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Office approve mutation
  const officeApproveMutation = useMutation({
    mutationFn: async ({ reportId, data }: {
      reportId: string;
      data: {
        officeStaff: string;
        officePhone: string;
        officeDamage: string;
        officeSignature: string;
      };
    }) => {
      return await apiRequest('PUT', `/api/reports/${reportId}/office-approve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "최종 승인 완료",
        description: "보고서가 최종 승인되어 완료되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "승인 실패",
        description: "최종 승인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Download report
  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Try to get filename from content-disposition header
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `DAMAGE_REPORT_${reportId}.txt`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "다운로드 완료",
        description: "확인서가 다운로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // Render appropriate view based on role and state
  if (!currentRole) {
    return <RoleSelection onSelectRole={setCurrentRole} />;
  }

  if (currentRole === 'driver') {
    if (!driverSession) {
      return (
        <DriverLogin
          vehicles={vehicles}
          onLogin={(vehicleNo, password) => driverLoginMutation.mutate({ vehicleNo, password })}
          isLoading={driverLoginMutation.isPending}
          onBack={() => setCurrentRole('')}
        />
      );
    }

    return (
      <DriverDashboard
        driverName={driverSession.driverName}
        vehicleNo={driverSession.vehicleNo}
        driverPhone={driverSession.driverPhone}
        reports={reports}
        cargoList={cargoList}
        onLogout={handleDriverLogout}
        onCreateReport={(data) => createReportMutation.mutate(data)}
        onUpdateReport={(reportId, data) => updateReportMutation.mutate({ reportId, data })}
        onDownloadReport={handleDownloadReport}
      />
    );
  }

  if (currentRole === 'field') {
    return (
      <FieldDashboard
        reports={reports}
        fieldStaffList={fieldStaffList}
        onBack={() => setCurrentRole('')}
        onApprove={(reportId, data) => fieldApproveMutation.mutate({ reportId, data })}
        onReject={(reportId, reason) => fieldRejectMutation.mutate({ reportId, reason })}
        onDownloadReport={handleDownloadReport}
      />
    );
  }

  // Office reject mutation
  const officeRejectMutation = useMutation({
    mutationFn: async ({ reportId, reason }: {
      reportId: string;
      reason: string;
    }) => {
      return await apiRequest('PUT', `/api/reports/${reportId}/office-reject`, {
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "보고서 반려",
        description: "보고서가 반려되었습니다. 현장이 다시 검토할 수 있습니다.",
      });
    },
    onError: () => {
      toast({
        title: "반려 실패",
        description: "보고서 반려 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  if (currentRole === 'office') {
    return (
      <OfficeDashboard
        reports={reports}
        officeStaffList={officeStaffList}
        onBack={() => setCurrentRole('')}
        onApprove={(reportId, data) => officeApproveMutation.mutate({ reportId, data })}
        onReject={(reportId, reason) => officeRejectMutation.mutate({ reportId, reason })}
        onDownloadReport={handleDownloadReport}
      />
    );
  }

  if (currentRole === 'admin') {
    return (
      <AdminDashboard
        onBack={() => setCurrentRole('')}
      />
    );
  }

  return null;
}
