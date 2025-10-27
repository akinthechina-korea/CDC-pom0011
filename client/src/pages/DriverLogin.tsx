import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

interface DriverLoginProps {
  onLogin: (vehicleNo: string, driverName: string, password: string) => void;
  isLoading?: boolean;
  onBack: () => void;
}

export default function DriverLogin({ onLogin, isLoading = false, onBack }: DriverLoginProps) {
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    if (!vehicleNo || !driverName || !password) {
      toast({
        title: "입력 오류",
        description: "차량번호, 운송기사 이름, 연락처를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onLogin(vehicleNo, driverName, password);
  };

  return (
    <div className="min-h-screen bg-driver/5 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-driver/10 flex items-center justify-center">
              <Truck className="w-8 h-8 text-driver" />
            </div>
            <div>
              <CardTitle className="text-2xl">운송기사 로그인</CardTitle>
              <CardDescription className="mt-2">
                차량번호, 이름, 연락처를 입력하세요
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vehicle">차량번호</Label>
              <Input
                id="vehicle"
                type="text"
                placeholder="예: 89하1234"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                data-testid="input-vehicle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driverName">운송기사 이름</Label>
              <Input
                id="driverName"
                type="text"
                placeholder="예: 홍길동"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                data-testid="input-driverName"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">연락처</Label>
              <Input
                id="password"
                type="text"
                placeholder="예: 010-1234-5678"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                data-testid="input-password"
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleLogin}
                disabled={!vehicleNo || !driverName || !password || isLoading}
                className="w-full bg-driver hover:bg-driver/90 text-driver-foreground"
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
      <Footer />
    </div>
  );
}
