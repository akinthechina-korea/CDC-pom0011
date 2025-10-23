import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Truck, ClipboardCheck, Settings } from "lucide-react";

interface RoleSelectionProps {
  onSelectRole: (role: 'driver' | 'field' | 'office' | 'admin') => void;
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <Card className="p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-title">
              컨테이너 DAMAGE 확인서
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              (株)天 一 國 際 物 流
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              경기도 평택시 포승읍 평택항로 95
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Driver Role */}
            <button
              onClick={() => onSelectRole('driver')}
              className="group relative overflow-visible"
              data-testid="button-role-driver"
            >
              <Card className="p-8 text-center transition-all hover-elevate active-elevate-2 h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-driver/10 flex items-center justify-center group-hover:bg-driver/20 transition-colors">
                    <Truck className="w-10 h-10 text-driver" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">운송기사</h2>
                    <p className="text-sm text-muted-foreground">
                      파손 보고서 작성 및 제출
                    </p>
                  </div>
                </div>
              </Card>
            </button>

            {/* Field Role */}
            <button
              onClick={() => onSelectRole('field')}
              className="group relative overflow-visible"
              data-testid="button-role-field"
            >
              <Card className="p-8 text-center transition-all hover-elevate active-elevate-2 h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-field/10 flex items-center justify-center group-hover:bg-field/20 transition-colors">
                    <ClipboardCheck className="w-10 h-10 text-field" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">현장 책임자</h2>
                    <p className="text-sm text-muted-foreground">
                      현장 확인 및 검토
                    </p>
                  </div>
                </div>
              </Card>
            </button>

            {/* Office Role */}
            <button
              onClick={() => onSelectRole('office')}
              className="group relative overflow-visible"
              data-testid="button-role-office"
            >
              <Card className="p-8 text-center transition-all hover-elevate active-elevate-2 h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-office/10 flex items-center justify-center group-hover:bg-office/20 transition-colors">
                    <FileText className="w-10 h-10 text-office" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">사무실 책임자</h2>
                    <p className="text-sm text-muted-foreground">
                      최종 승인 및 문서 생성
                    </p>
                  </div>
                </div>
              </Card>
            </button>

            {/* Admin Role */}
            <button
              onClick={() => onSelectRole('admin')}
              className="group relative overflow-visible"
              data-testid="button-role-admin"
            >
              <Card className="p-8 text-center transition-all hover-elevate active-elevate-2 h-full">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Settings className="w-10 h-10 text-accent-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">관리자</h2>
                    <p className="text-sm text-muted-foreground">
                      데이터 관리 및 설정
                    </p>
                  </div>
                </div>
              </Card>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
