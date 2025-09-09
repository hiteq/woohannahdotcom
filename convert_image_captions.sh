#!/bin/bash

# 이미지 캡션 변환 스크립트
# 사용법: ./convert_image_captions.sh [파일명]

convert_captions() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "파일을 찾을 수 없습니다: $file"
        return 1
    fi

    echo "처리 중: $file"

    # 임시 파일 생성
    temp_file=$(mktemp)

    # sed를 사용하여 이미지 다음 줄의 일반 텍스트를 이탤릭체로 변환
    sed '/^!\[\[.*\]$/,/^$/{n;/^$/!{/^[*_]/!s/.*/\*&\*/;};}' "$file" > "$temp_file"

    # 원본 파일 백업
    cp "$file" "${file}.backup"

    # 변환된 파일로 교체
    mv "$temp_file" "$file"

    echo "완료: $file"
}

# 인자가 없으면 모든 전시 파일 처리
if [[ $# -eq 0 ]]; then
    echo "모든 전시 파일의 이미지 캡션을 변환합니다..."
    for file in content/Exhibitions/*.md; do
        if [[ -f "$file" ]]; then
            convert_captions "$file"
        fi
    done
else
    # 특정 파일만 처리
    convert_captions "$1"
fi

echo "변환이 완료되었습니다!"
echo "원본 파일은 .backup 확장자로 백업되었습니다."
