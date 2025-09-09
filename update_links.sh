#!/bin/bash

# Sculptural Impulse 링크들 수정
sed -i '' 's/220808.*resize-(10)/sculptural-impulse-17-2022/g' content/Exhibitions/2022,\ Sculptural\ Impulse.md
sed -i '' 's/220808.*resize-(12)/sculptural-impulse-18-2022/g' content/Exhibitions/2022,\ Sculptural\ Impulse.md
sed -i '' 's/220808.*resize-(15)/sculptural-impulse-19-2022/g' content/Exhibitions/2022,\ Sculptural\ Impulse.md
sed -i '' 's/220808.*resize-(24)/sculptural-impulse-21-2022/g' content/Exhibitions/2022,\ Sculptural\ Impulse.md
sed -i '' 's/220808.*resize-(25)/sculptural-impulse-22-2022/g' content/Exhibitions/2022,\ Sculptural\ Impulse.md

# Vitalis violentia 링크 수정
sed -i '' 's/%E1%84%8B%E1%85%AE%E1%84%92%E1%85%A1%E1%86%AB%E1%84%82%E1%85%A1_%E1%84%87%E1%85%B3%E1%86%AF%E1%84%85%E1%85%B5%E1%84%83%E1%85%B5%E1%86%BC-2024-Bleeding-Tungsten-(1) 2.jpg/tungsten-24-2024.jpg/g' content/Exhibitions/2024,\ Vitalis\ violentia.md

# Installations 링크 수정  
sed -i '' 's/220808.*resize-(25)/sculptural-impulse-22-2022/g' content/Works/Installations/Installations.md

echo "Link updates completed!"
