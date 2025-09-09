#!/usr/bin/env python3
import os
import re
from pathlib import Path

def clean_duplicates(file_path):
    """중복된 캡션 라인들을 제거"""
    print(f"중복 정리 중: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.read().split('\n')

    cleaned_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # 현재 라인을 추가
        cleaned_lines.append(line)

        # 현재 라인이 이미지 링크인 경우
        if re.match(r'^!\[\[.*\]\]$', line.strip()):
            image_line = i

            # 다음 라인들을 확인
            j = i + 1
            captions = []

            # 이미지 다음의 연속된 캡션 라인들을 수집
            while j < len(lines):
                next_line = lines[j].strip()

                # 빈 줄이거나 다음 이미지 링크를 만나면 중단
                if next_line == '' or re.match(r'^!\[\[.*\]\]$', next_line):
                    break

                # *로 시작하는 캡션 라인인 경우
                if next_line.startswith('*') and next_line.endswith('*'):
                    captions.append(next_line)
                    j += 1
                else:
                    break

            # 중복 제거: 첫 번째 캡션만 유지
            if captions:
                cleaned_lines.append(captions[0])  # 첫 번째 캡션만 추가
                # 나머지 캡션들은 건너뜀
                i = j - 1
            else:
                i += 1
        else:
            i += 1

    # 파일 쓰기
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(cleaned_lines))

    print(f"완료: {file_path}")

def find_and_clean_duplicates():
    """content 폴더에서 이미지 파일이 있는 .md 파일들을 찾아서 중복 정리"""
    content_dir = Path('content')

    if not content_dir.exists():
        print("content 폴더를 찾을 수 없습니다.")
        return

    md_files = list(content_dir.rglob('*.md'))
    print(f"총 {len(md_files)}개의 .md 파일을 찾았습니다.")

    cleaned_count = 0

    for md_file in md_files:
        try:
            # 파일 내용 확인
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 이미지 링크가 있는지 확인
            if '! [[' in content or '![[' in content:
                print(f"\n이미지 파일 발견: {md_file}")

                # 백업 생성 (이미 백업이 있으면 건너뜀)
                backup_file = str(md_file) + '.backup'
                if not os.path.exists(backup_file):
                    with open(backup_file, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"백업 생성: {backup_file}")

                clean_duplicates(md_file)
                cleaned_count += 1

        except Exception as e:
            print(f"오류 ({md_file}): {e}")

    print(f"\n총 {cleaned_count}개의 파일에서 중복을 정리했습니다.")

if __name__ == "__main__":
    find_and_clean_duplicates()
