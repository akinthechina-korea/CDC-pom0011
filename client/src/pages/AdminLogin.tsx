import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  onLogin: (adminName: string, password: string, securityCode: string) => void;
  isLoading?: boolean;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, isLoading = false, onBack }: AdminLoginProps) {
  const [adminName, setAdminName] = useState<string>("");
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    if (!adminName || !password || !securityCode) {
      toast({
        title: "입력 오류",
        description: "모든 항목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onLogin(adminName, password, securityCode);
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
              <Label htmlFor="admin">관리자 이름</Label>
              <Input
                id="admin"
                type="text"
                placeholder="예: 천일요비"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                data-testid="input-admin-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 (연락처 번호, "-" 제외)</Label>
              <Input
                id="password"
                type="password"
                placeholder="예: 01011111111"
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
                placeholder="관리자 보안 코드 입력"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                data-testid="input-security-code"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleLogin}
                disabled={!adminName || !password || !securityCode || isLoading}
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
