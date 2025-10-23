import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle } from "@shared/schema";

interface DriverLoginProps {
  vehicles: Vehicle[];
  onLogin: (vehicleNo: string, password: string) => void;
  isLoading?: boolean;
  onBack: () => void;
}

export default function DriverLogin({ vehicles, onLogin, isLoading = false, onBack }: DriverLoginProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = () => {
    if (!selectedVehicle || !password) {
      toast({
        title: "입력 오류",
        description: "차량번호와 비밀번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onLogin(selectedVehicle, password);
  };

  return (
    <div className="min-h-screen bg-driver/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-driver/10 flex items-center justify-center">
              <Truck className="w-8 h-8 text-driver" />
            </div>
            <div>
              <CardTitle className="text-2xl">운송기사 로그인</CardTitle>
              <CardDescription className="mt-2">
                차량번호와 비밀번호를 입력하세요
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vehicle">차량번호</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="vehicle" data-testid="select-vehicle">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.vehicleNo}>
                      {vehicle.vehicleNo}
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
                placeholder="예: 01099421118"
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
                disabled={!selectedVehicle || !password || isLoading}
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
  );
}
