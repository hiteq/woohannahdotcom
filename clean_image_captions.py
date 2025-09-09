#!/usr/bin/env python3
import os
import re
from pathlib import Path

def clean_image_captions(file_path):
    """이미지와 캡션 사이의 불필요한 공백을 정리"""
    print(f"정리 중: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    processed_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]
        processed_lines.append(line)

        # 이미지 링크를 찾았을 때
        if re.match(r'^!\[\[.*\]\]$', line.strip()):
            image_line = i

            # 다음 줄들을 확인
            j = i + 1
            empty_lines_count = 0

            # 빈 줄들을 세기
            while j < len(lines) and lines[j].strip() == '':
                empty_lines_count += 1
                j += 1

            # 빈 줄들 다음에 캡션이 있는지 확인
            if j < len(lines) and re.match(r'^\*.*\*$', lines[j].strip()):
                # 빈 줄들이 2줄 이상이면 1줄로 줄임
                if empty_lines_count > 1:
                    # 기존 빈 줄들을 제거하고 1줄만 남김
                    processed_lines.append('')  # 1줄의 빈 줄만 남김
                    processed_lines.append(lines[j])  # 캡션 추가
                    j += 1
                else:
                    # 빈 줄이 1줄 이하면 그대로 유지
                    for k in range(i + 1, j + 1):
                        processed_lines.append(lines[k])
                    j += 1

                i = j - 1  # 다음 처리할 줄로 이동
            else:
                # 캡션이 없으면 빈 줄들을 그대로 유지
                for k in range(i + 1, j):
                    processed_lines.append(lines[k])
                i = j - 1
        else:
            i += 1

    # 파일 쓰기
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(processed_lines))

    print(f"완료: {file_path}")

def find_and_clean_files():
    """content 폴더에서 이미지 파일이 있는 .md 파일들을 찾아서 정리"""
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

                clean_image_captions(md_file)
                cleaned_count += 1

        except Exception as e:
            print(f"오류 ({md_file}): {e}")

    print(f"\n총 {cleaned_count}개의 파일을 정리했습니다.")

if __name__ == "__main__":
    find_and_clean_files()
