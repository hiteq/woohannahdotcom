#!/usr/bin/env python3
import os
import re
from pathlib import Path

def check_image_patterns():
    """content 폴더에서 이미지와 캡션 패턴을 확인"""
    content_dir = Path('content')

    if not content_dir.exists():
        print("content 폴더를 찾을 수 없습니다.")
        return

    total_images = 0
    processed_captions = 0
    unprocessed_captions = 0

    print("🔍 Content 폴더의 이미지 패턴을 분석 중...\n")

    for md_file in content_dir.rglob('*.md'):
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()

            lines = content.split('\n')
            i = 0

            while i < len(lines):
                line = lines[i].strip()

                # 이미지 링크를 찾았을 때
                if re.match(r'^!\[\[.*\]\]$', line):
                    total_images += 1
                    image_line = i

                    # 다음 줄들을 확인
                    j = i + 1
                    found_caption = False

                    while j < len(lines):
                        next_line = lines[j].strip()

                        # 빈 줄이면 계속 진행
                        if next_line == '':
                            j += 1
                            continue

                        # 다음 이미지 링크를 만나면 중단
                        if re.match(r'^!\[\[.*\]\]$', next_line):
                            break

                        # 일반 텍스트이고, 이미 *로 감싸져 있으면
                        if next_line and next_line.startswith('*') and next_line.endswith('*'):
                            processed_captions += 1
                            found_caption = True
                            print(f"✅ {md_file.name}: {next_line}")
                            break
                        # 일반 텍스트이고, *로 감싸져 있지 않으면
                        elif next_line and not next_line.startswith('*') and not next_line.startswith('!') and not next_line.startswith('[') and not next_line.startswith('#'):
                            unprocessed_captions += 1
                            print(f"❌ {md_file.name}: {next_line}")
                            found_caption = True
                            break

                        j += 1

                    if found_caption:
                        i = j
                    else:
                        i += 1
                else:
                    i += 1

        except Exception as e:
            print(f"오류 ({md_file}): {e}")

    print("\n📊 분석 결과:")
    print(f"   총 이미지 수: {total_images}")
    print(f"   처리된 캡션: {processed_captions}")
    print(f"   미처리 캡션: {unprocessed_captions}")

if __name__ == "__main__":
    check_image_patterns()
