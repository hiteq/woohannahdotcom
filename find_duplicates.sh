#!/bin/bash
# 스크립트: find_duplicates.sh

# 1. 해시와 전체 파일 경로를 포함하는 리스트 생성
find content/Images -type f -exec md5 -r {} + > file_hashes.txt

# 2. 해시값을 기준으로 정렬
sort file_hashes.txt > sorted_hashes.txt

# 3. awk를 사용하여 중복 파일 찾기
awk '
  NR > 1 && $1 != prev_hash {
    if (count > 1) {
      for (i = 0; i < count; i++) {
        print lines[i];
      }
      print ""; # 그룹 사이에 빈 줄 추가
    }
    count = 0;
    delete lines;
  }
  {
    lines[count] = $0;
    count++;
    prev_hash = $1;
  }
  END {
    if (count > 1) {
      for (i = 0; i < count; i++) {
        print lines[i];
      }
    }
  }
' sorted_hashes.txt

# 4. 임시 파일 삭제
rm file_hashes.txt sorted_hashes.txt
