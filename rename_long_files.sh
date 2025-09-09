#!/bin/bash

# 긴 파일명들을 짧은 이름으로 변경하는 스크립트

cd content/Images

# 카운터 초기화
counter=1

# 긴 파일명들을 찾아서 변경
for file in *.jpg; do
    if [[ "$file" =~ ^%E1 ]]; then
        # 파일 내용에 따라 적절한 이름 부여
        if [[ "$file" =~ Bleeding ]]; then
            newname="bleeding-${counter}-2024.jpg"
        elif [[ "$file" =~ Mama ]]; then
            newname="mama-piano-${counter}-2024.jpg"
        elif [[ "$file" =~ Tungsten ]]; then
            newname="tungsten-${counter}-2024.jpg"
        else
            newname="artwork-${counter}-2024.jpg"
        fi
        
        echo "Renaming: $file -> $newname"
        mv "$file" "$newname"
        ((counter++))
    fi
done

echo "Renaming completed!"
