#!/bin/bash

# 배포 준비 스크립트
# 사용법: ./deploy.sh

set -e

echo "🚀 배포 준비를 시작합니다..."

# 1. 변경사항 확인
echo "📋 변경사항 확인 중..."
git status

# 2. 커밋 확인
read -p "변경사항을 커밋하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add -A
    git commit -m "Prepare for deployment: Add Railway config and deployment docs"
    echo "✅ 커밋 완료"
fi

# 3. GitHub 원격 저장소 확인
echo "🔗 GitHub 원격 저장소 확인 중..."
if ! git remote | grep -q "origin"; then
    echo "⚠️  GitHub 원격 저장소가 설정되지 않았습니다."
    echo "다음 명령어로 GitHub 저장소를 추가하세요:"
    echo "git remote add origin https://github.com/akinthechina/CDC-pom0011.git"
    echo ""
    read -p "지금 GitHub 저장소를 추가하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "GitHub 저장소 URL을 입력하세요: " repo_url
        git remote add origin "$repo_url"
        echo "✅ 원격 저장소 추가 완료"
    fi
else
    echo "✅ 원격 저장소가 이미 설정되어 있습니다."
    git remote -v
fi

# 4. 푸시 확인
read -p "GitHub에 푸시하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push -u origin main
    echo "✅ 푸시 완료"
fi

echo ""
echo "🎉 배포 준비가 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. https://railway.app 접속"
echo "2. GitHub로 로그인"
echo "3. 'New Project' → 'Deploy from GitHub repo' 선택"
echo "4. 이 저장소 선택"
echo "5. PostgreSQL 데이터베이스 추가"
echo "6. 배포 완료!"

