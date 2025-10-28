import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Upload, AlertCircle, CheckCircle, Download, Edit, Save, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Papa from "papaparse";
import Footer from "@/components/Footer";
import type { Cargo, Vehicle, FieldStaff, OfficeStaff } from "@shared/schema";

interface AdminDashboardProps {
  adminName: string;
  adminPhone: string;
  onLogout: () => void;
}

type DataType = 'cargo' | 'vehicles' | 'field-staff' | 'office-staff';

export default function AdminDashboard({ adminName, adminPhone, onLogout }: AdminDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<DataType>('vehicles');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  
  // Editable table states
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<any[]>([]);

  // Fetch all master data
  const { data: cargo = [] } = useQuery<Cargo[]>({ queryKey: ['/api/data/cargo'] });
  const { data: vehicles = [] } = useQuery<Vehicle[]>({ queryKey: ['/api/data/vehicles'] });
  const { data: fieldStaff = [] } = useQuery<FieldStaff[]>({ queryKey: ['/api/data/field-staff'] });
  const { data: officeStaff = [] } = useQuery<OfficeStaff[]>({ queryKey: ['/api/data/office-staff'] });

  // Upload mutation (for CSV upload - appends data)
  const uploadMutation = useMutation({
    mutationFn: async ({ type, data }: { type: DataType; data: any[] }) => {
      return await apiRequest('POST', `/api/data/${type}/bulk`, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "업로드 완료",
        description: `${variables.data.length}개 항목이 업로드되었습니다.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/data/${variables.type}`] });
      setUploadFile(null);
      setPreviewData([]);
      setParseErrors([]);
    },
    onError: (error: any) => {
      toast({
        title: "업로드 실패",
        description: error?.message || "데이터 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // Replace mutation (for inline editing - replaces all data)
  const replaceMutation = useMutation({
    mutationFn: async ({ type, data }: { type: DataType; data: any[] }) => {
      return await apiRequest('POST', `/api/data/${type}/replace`, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: "저장 완료",
        description: `${variables.data.length}개 항목이 저장되었습니다.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/data/${variables.type}`] });
      setIsEditing(false);
      setEditableData([]);
    },
    onError: (error: any) => {
      toast({
        title: "저장 실패",
        description: error?.message || "데이터 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "파일 형식 오류",
        description: "CSV 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setUploadFile(file);
    setParseErrors([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const validData: any[] = [];

        results.data.forEach((row: any, index) => {
          const validation = validateRow(activeTab, row);
          if (validation.valid) {
            validData.push(validation.data);
          } else {
            errors.push(`라인 ${index + 2}: ${validation.error}`);
          }
        });

        setPreviewData(validData);
        setParseErrors(errors);
      },
      error: (error) => {
        toast({
          title: "파싱 오류",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const validateRow = (type: DataType, row: any): { valid: boolean; data?: any; error?: string } => {
    switch (type) {
      case 'cargo':
        if (!row.containerNo || !row.blNo || !row.date) {
          return { valid: false, error: "containerNo, blNo, date 필드가 필요합니다" };
        }
        return { valid: true, data: { containerNo: row.containerNo, blNo: row.blNo, date: row.date } };

      case 'vehicles':
        if (!row.vehicleNo || !row.driverName || !row.driverPhone) {
          return { valid: false, error: "vehicleNo, driverName, driverPhone 필드가 필요합니다" };
        }
        return { valid: true, data: { vehicleNo: row.vehicleNo, driverName: row.driverName, driverPhone: row.driverPhone } };

      case 'field-staff':
      case 'office-staff':
        if (!row.name || !row.phone) {
          return { valid: false, error: "name, phone 필드가 필요합니다" };
        }
        return { valid: true, data: { name: row.name, phone: row.phone } };

      default:
        return { valid: false, error: "알 수 없는 데이터 타입" };
    }
  };

  const handleUpload = () => {
    if (previewData.length === 0) {
      toast({
        title: "데이터 없음",
        description: "업로드할 유효한 데이터가 없습니다.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ type: activeTab, data: previewData });
  };

  const downloadTemplate = (type: DataType) => {
    let headers: string[] = [];
    let sampleRow: string[] = [];

    switch (type) {
      case 'cargo':
        headers = ['containerNo', 'blNo', 'date'];
        sampleRow = ['TCLU8239466', 'CHL20251001', '2025-10-01'];
        break;
      case 'vehicles':
        headers = ['vehicleNo', 'driverName', 'driverPhone'];
        sampleRow = ['89하1234', '박영호', '010-9942-1118'];
        break;
      case 'field-staff':
      case 'office-staff':
        headers = ['name', 'phone'];
        sampleRow = ['김철수', '010-1234-5678'];
        break;
    }

    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'cargo': return cargo;
      case 'vehicles': return vehicles;
      case 'field-staff': return fieldStaff;
      case 'office-staff': return officeStaff;
      default: return [];
    }
  };

  // Editable table functions
  const startEditing = () => {
    const currentData = getCurrentData();
    setEditableData(JSON.parse(JSON.stringify(currentData))); // Deep copy
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditableData([]);
  };

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    const newData = [...editableData];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setEditableData(newData);
  };

  const handleAddRow = () => {
    const emptyRow: any = {};
    switch (activeTab) {
      case 'cargo':
        emptyRow.containerNo = '';
        emptyRow.blNo = '';
        emptyRow.date = '';
        break;
      case 'vehicles':
        emptyRow.vehicleNo = '';
        emptyRow.driverName = '';
        emptyRow.driverPhone = '';
        break;
      case 'field-staff':
      case 'office-staff':
        emptyRow.name = '';
        emptyRow.phone = '';
        break;
    }
    setEditableData([...editableData, emptyRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = editableData.filter((_, index) => index !== rowIndex);
    setEditableData(newData);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const rows = pastedText.trim().split('\n');
    const newRows: any[] = [];

    rows.forEach(row => {
      const cells = row.split('\t');
      const newRow: any = {};
      
      switch (activeTab) {
        case 'cargo':
          if (cells.length >= 3) {
            newRow.containerNo = cells[0]?.trim() || '';
            newRow.blNo = cells[1]?.trim() || '';
            newRow.date = cells[2]?.trim() || '';
            newRows.push(newRow);
          }
          break;
        case 'vehicles':
          if (cells.length >= 3) {
            newRow.vehicleNo = cells[0]?.trim() || '';
            newRow.driverName = cells[1]?.trim() || '';
            newRow.driverPhone = cells[2]?.trim() || '';
            newRows.push(newRow);
          }
          break;
        case 'field-staff':
        case 'office-staff':
          if (cells.length >= 2) {
            newRow.name = cells[0]?.trim() || '';
            newRow.phone = cells[1]?.trim() || '';
            newRows.push(newRow);
          }
          break;
      }
    });

    if (newRows.length > 0) {
      setEditableData([...editableData, ...newRows]);
      toast({
        title: "붙여넣기 완료",
        description: `${newRows.length}개의 행이 추가되었습니다.`,
      });
    }
  };

  const handleSave = () => {
    // Validate all rows first
    const invalidRows: number[] = [];
    
    editableData.forEach((row, index) => {
      let isValid = false;
      
      switch (activeTab) {
        case 'cargo':
          isValid = !!(row.containerNo?.trim() && row.blNo?.trim() && row.date?.trim());
          break;
        case 'vehicles':
          isValid = !!(row.vehicleNo?.trim() && row.driverName?.trim() && row.driverPhone?.trim());
          break;
        case 'field-staff':
        case 'office-staff':
          isValid = !!(row.name?.trim() && row.phone?.trim());
          break;
      }
      
      if (!isValid) {
        invalidRows.push(index + 1);
      }
    });

    if (invalidRows.length > 0) {
      toast({
        title: "저장 실패",
        description: `${invalidRows.length}개 행에 필수 정보가 누락되었습니다. (행 번호: ${invalidRows.slice(0, 5).join(', ')}${invalidRows.length > 5 ? '...' : ''})`,
        variant: "destructive",
      });
      return;
    }

    // Extract only insert schema fields (remove id, timestamps, etc.)
    const insertData = editableData.map(row => {
      switch (activeTab) {
        case 'cargo':
          return {
            containerNo: row.containerNo.trim(),
            blNo: row.blNo.trim(),
            date: row.date.trim()
          };
        case 'vehicles':
          return {
            vehicleNo: row.vehicleNo.trim(),
            driverName: row.driverName.trim(),
            driverPhone: row.driverPhone.trim()
          };
        case 'field-staff':
        case 'office-staff':
          return {
            name: row.name.trim(),
            phone: row.phone.trim()
          };
        default:
          throw new Error(`Unknown data type: ${activeTab}`);
      }
    });

    replaceMutation.mutate({ type: activeTab, data: insertData });
  };

  const renderEditableTable = (data: any[], type: DataType) => {
    return (
      <div onPaste={handlePaste} className="focus:outline-none" tabIndex={0}>
        <Table>
          <TableHeader>
            <TableRow>
              {type === 'cargo' && (
                <>
                  <TableHead>B/L 번호</TableHead>
                  <TableHead>컨테이너 번호</TableHead>
                  <TableHead>화물 일자</TableHead>
                  <TableHead className="w-20">삭제</TableHead>
                </>
              )}
              {type === 'vehicles' && (
                <>
                  <TableHead>차량번호</TableHead>
                  <TableHead>운송기사</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead className="w-20">삭제</TableHead>
                </>
              )}
              {(type === 'field-staff' || type === 'office-staff') && (
                <>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead className="w-20">삭제</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                {type === 'cargo' && (
                  <>
                    <TableCell>
                      <input
                        type="text"
                        value={item.blNo || ''}
                        onChange={(e) => handleCellChange(index, 'blNo', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={item.containerNo || ''}
                        onChange={(e) => handleCellChange(index, 'containerNo', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={item.date || ''}
                        onChange={(e) => handleCellChange(index, 'date', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                        placeholder="YYYY-MM-DD"
                      />
                    </TableCell>
                  </>
                )}
                {type === 'vehicles' && (
                  <>
                    <TableCell>
                      <input
                        type="text"
                        value={item.vehicleNo || ''}
                        onChange={(e) => handleCellChange(index, 'vehicleNo', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={item.driverName || ''}
                        onChange={(e) => handleCellChange(index, 'driverName', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={item.driverPhone || ''}
                        onChange={(e) => handleCellChange(index, 'driverPhone', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </TableCell>
                  </>
                )}
                {(type === 'field-staff' || type === 'office-staff') && (
                  <>
                    <TableCell>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleCellChange(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        value={item.phone || ''}
                        onChange={(e) => handleCellChange(index, 'phone', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </TableCell>
                  </>
                )}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRow(index)}
                    data-testid={`button-delete-row-${index}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderDataTable = (data: any[], type: DataType) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>등록된 데이터가 없습니다.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {type === 'cargo' && (
              <>
                <TableHead>컨테이너 번호</TableHead>
                <TableHead>B/L 번호</TableHead>
                <TableHead>화물 일자</TableHead>
              </>
            )}
            {type === 'vehicles' && (
              <>
                <TableHead>차량번호</TableHead>
                <TableHead>운송기사</TableHead>
                <TableHead>연락처</TableHead>
              </>
            )}
            {(type === 'field-staff' || type === 'office-staff') && (
              <>
                <TableHead>이름</TableHead>
                <TableHead>연락처</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              {type === 'cargo' && (
                <>
                  <TableCell>{item.containerNo}</TableCell>
                  <TableCell>{item.blNo}</TableCell>
                  <TableCell>{item.date}</TableCell>
                </>
              )}
              {type === 'vehicles' && (
                <>
                  <TableCell>{item.vehicleNo}</TableCell>
                  <TableCell>{item.driverName}</TableCell>
                  <TableCell>{item.driverPhone}</TableCell>
                </>
              )}
              {(type === 'field-staff' || type === 'office-staff') && (
                <>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const getTabLabel = (type: DataType) => {
    switch (type) {
      case 'cargo': return '화물';
      case 'vehicles': return '차량/운송기사';
      case 'field-staff': return '현장 담당자';
      case 'office-staff': return '사무실 담당자';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div>
                <h1 className="text-2xl font-bold">관리자 대시보드</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">{adminName}</span>
                  <span>•</span>
                  <span>{adminPhone}</span>
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

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DataType)}>
          <TabsList className="grid grid-cols-4 w-full mx-auto md:max-w-2xl mb-6">
            <TabsTrigger value="vehicles">차량</TabsTrigger>
            <TabsTrigger value="cargo">화물</TabsTrigger>
            <TabsTrigger value="field-staff">현장</TabsTrigger>
            <TabsTrigger value="office-staff">사무실</TabsTrigger>
          </TabsList>

          {(['vehicles', 'cargo', 'field-staff', 'office-staff'] as DataType[]).map((type) => (
            <TabsContent key={type} value={type} className="space-y-6">
              {/* Upload Section */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">CSV 업로드</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTemplate(type)}
                      data-testid="button-download-template"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      템플릿 다운로드
                    </Button>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id={`file-upload-${type}`}
                      data-testid="input-csv-file"
                    />
                    <label htmlFor={`file-upload-${type}`}>
                      <Button variant="outline" asChild>
                        <span>CSV 파일 선택</span>
                      </Button>
                    </label>
                    {uploadFile && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        선택된 파일: {uploadFile.name}
                      </p>
                    )}
                  </div>

                  {parseErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-semibold mb-1">검증 오류:</div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {parseErrors.slice(0, 5).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                          {parseErrors.length > 5 && (
                            <li>그 외 {parseErrors.length - 5}개 오류...</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {previewData.length > 0 && (
                    <>
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          {previewData.length}개의 유효한 항목이 준비되었습니다.
                        </AlertDescription>
                      </Alert>

                      <div className="max-h-64 overflow-auto border rounded-lg">
                        {renderDataTable(previewData, type)}
                      </div>

                      <Button
                        onClick={handleUpload}
                        disabled={uploadMutation.isPending}
                        className="w-full"
                        data-testid="button-upload"
                      >
                        {uploadMutation.isPending ? "업로드 중..." : "데이터 업로드"}
                      </Button>
                    </>
                  )}
                </div>
              </Card>

              {/* Current Data Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    현재 데이터 ({isEditing ? editableData.length : getCurrentData().length}개)
                  </h2>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        onClick={startEditing}
                        variant="outline"
                        size="sm"
                        data-testid="button-start-edit"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        편집 모드
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleAddRow}
                          variant="outline"
                          size="sm"
                          data-testid="button-add-row"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          행 추가
                        </Button>
                        <Button
                          onClick={cancelEditing}
                          variant="outline"
                          size="sm"
                          data-testid="button-cancel-edit"
                        >
                          <X className="w-4 h-4 mr-2" />
                          취소
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={replaceMutation.isPending}
                          size="sm"
                          data-testid="button-save"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {replaceMutation.isPending ? "저장 중..." : "저장"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Excel/Google Sheets에서 데이터를 복사하여 테이블에 붙여넣기(Ctrl+V) 할 수 있습니다.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="max-h-96 overflow-auto border rounded-lg">
                  {isEditing 
                    ? renderEditableTable(editableData, type)
                    : renderDataTable(getCurrentData(), type)
                  }
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
