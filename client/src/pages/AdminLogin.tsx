import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AdminStaff } from "@shared/schema";

interface AdminLoginProps {
  adminStaffList: AdminStaff[];
  onLogin: (staffId: string, password: string) => void;
  isLoading?: boolean;
  onBack: () => void;
}

export default function AdminLogin({ adminStaffList, onLogin, isLoading = false, onBack }: AdminLoginProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    if (!selectedStaff || !password) {
      toast({
        title: "입력 오류",
        description: "관리자와 비밀번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onLogin(selectedStaff, password);
  };

  return (
    <div className="min-h-screen bg-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Settings className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">관리자 로그인</CardTitle>
              <CardDescription className="mt-2">
                관리자와 비밀번호를 입력하세요
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="staff">관리자</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger id="staff" data-testid="select-admin">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {adminStaffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (연락처 번호, "-" 제외)</Label>
              <Input
                id="password"
                type="password"
                placeholder="예: 01011111111"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                data-testid="input-password"
              />
              <p className="text-xs text-muted-foreground">
                * 연락처 번호에서 "-"를 제거한 숫자만 입력
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleLogin}
                disabled={!selectedStaff || !password || isLoading}
                className="w-full"
                data-testid="button-login"
              >
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>

              <Button
                onClick={onBack}
                variant="outline"
                className="w-full"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                역할 선택으로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
