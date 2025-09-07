#!/bin/bash

echo "=== 이미지 링크 검증 시작 ===" >> image_link_check.log

# 모든 markdown 파일에서 이미지 링크 추출
find content -name "*.md" | while read -r file; do
    echo "파일 확인: $file" >> image_link_check.log
    
    # 파일에서 이미지 링크 추출 (Images/ 폴더를 가리키는 것만)
    grep -o '!\\[\\[Images/[^]]*\\]\\]' "$file" | while read -r link; do
        # 링크에서 파일명 추출
        image_file=$(echo "$link" | sed 's/!\\[\\[Images\/\([^|]*\).*/\1/')
        
        # 실제 파일 존재 여부 확인
        if [ -f "content/Images/$image_file" ]; then
            echo "  ✅ $image_file - 존재함" >> image_link_check.log
        else
            echo "  ❌ $image_file - 존재하지 않음" >> image_link_check.log
        fi
    done
done

echo "" >> image_link_check.log
echo "=== 검증 완료 ===" >> image_link_check.log
