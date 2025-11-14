import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({ photos, onChange, maxPhotos = 5 }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "사진 개수 초과",
        description: `최대 ${maxPhotos}장까지 업로드할 수 있습니다`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // 안드로이드 호환성: 파일 정보 로깅
        console.log(`파일 업로드 시도: ${file.name}, type: ${file.type}, size: ${file.size}bytes`);
        
        const formData = new FormData();
        formData.append('photo', file);

        // 안드로이드 호환성: Content-Type 헤더를 명시하지 않음 (FormData가 자동 설정)
        const response = await fetch('/api/upload/damage-photo', {
          method: 'POST',
          body: formData,
          // Content-Type 헤더를 설정하지 않음 - 브라우저가 자동으로 multipart/form-data로 설정
        });

        if (!response.ok) {
          let errorMessage = '업로드 실패';
          try {
            const error = await response.json();
            errorMessage = error.error || error.details || errorMessage;
            console.error('업로드 실패 응답:', error);
          } catch (e) {
            console.error('업로드 실패 (응답 파싱 오류):', response.status, response.statusText);
            errorMessage = `서버 오류: ${response.status} ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`파일 업로드 성공: ${file.name} -> ${data.url}`);
        uploadedUrls.push(data.url);
      }

      onChange([...photos, ...uploadedUrls]);
      toast({
        title: "업로드 완료",
        description: `${files.length}장의 사진이 업로드되었습니다`,
      });
    } catch (error: any) {
      toast({
        title: "업로드 실패",
        description: error.message || "사진 업로드 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || photos.length >= maxPhotos}
          onClick={() => document.getElementById('photo-input')?.click()}
          data-testid="button-upload-photo"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "업로드 중..." : "사진 추가"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {photos.length}/{maxPhotos}장
        </span>
        <input
          id="photo-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          data-testid="input-photo-file"
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photoUrl, index) => (
            <div
              key={index}
              className="relative group rounded-md overflow-hidden border bg-muted aspect-square"
              data-testid={`photo-preview-${index}`}
            >
              <img
                src={photoUrl}
                alt={`파손 사진 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
                data-testid={`button-remove-photo-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="border-2 border-dashed rounded-md p-8 text-center text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">파손 사진을 추가해주세요</p>
          <p className="text-xs mt-1">JPG, PNG, WEBP (최대 5MB)</p>
        </div>
      )}
    </div>
  );
}
