import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FieldLoginProps {
  onLogin: (staffName: string, password: string, securityCode: string) => void;
  isLoading?: boolean;
  onBack: () => void;
}

export default function FieldLogin({ onLogin, isLoading = false, onBack }: FieldLoginProps) {
  const [staffName, setStaffName] = useState<string>("");
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    if (!staffName || !password || !securityCode) {
      toast({
        title: "입력 오류",
        description: "모든 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onLogin(staffName, password, securityCode);
  };

  return (
    <div className="min-h-screen bg-field/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-field/10 flex items-center justify-center">
              <ClipboardCheck className="w-8 h-8 text-field" />
            </div>
            <div>
              <CardTitle className="text-2xl">현장 책임자 로그인</CardTitle>
              <CardDescription className="mt-2">
                담당자와 비밀번호를 입력하세요
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="staff">담당자 이름</Label>
              <Input
                id="staff"
                type="text"
                placeholder="예: 김도훈"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                data-testid="input-staff-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (연락처 번호, "-" 제외)</Label>
              <Input
                id="password"
                type="password"
                placeholder="예: 01023841156"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
              <p className="text-xs text-muted-foreground">
                * 연락처 번호에서 "-"를 제거한 숫자만 입력
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityCode">보안 코드</Label>
              <Input
                id="securityCode"
                type="password"
                placeholder="현장 보안 코드 입력"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                data-testid="input-security-code"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleLogin}
                disabled={!staffName || !password || !securityCode || isLoading}
                className="w-full bg-field hover:bg-field/90 text-field-foreground"
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
