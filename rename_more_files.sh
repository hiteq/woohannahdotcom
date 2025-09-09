#!/bin/bash

cd content/Images

counter=10

# 220808 파일들 변경
for file in 220808*.jpg; do
    if [[ "$file" =~ 220808 ]]; then
        newname="sculptural-impulse-${counter}-2022.jpg"
        echo "Renaming: $file -> $newname"
        mv "$file" "$newname"
        ((counter++))
    fi
done

# 남은 Tungsten 파일 변경
for file in *Tungsten*.jpg; do
    if [[ "$file" =~ Tungsten ]]; then
        newname="tungsten-${counter}-2024.jpg"
        echo "Renaming: $file -> $newname" 
        mv "$file" "$newname"
        ((counter++))
    fi
done

echo "Additional renaming completed!"
