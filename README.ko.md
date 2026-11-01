# GitHub Repository Language Graph

[English](README.md) | 한국어

**특정 GitHub 저장소**의 언어 통계를 SVG 위젯으로 보여줍니다. 어떤 README에든 넣을 수 있습니다.

![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=snowykte0426&repo=github-repository-language-graph-widget)

## 사용법

```
https://github-repository-language-graph-wi.vercel.app/api?username={owner}&repo={repo}
```

README에 넣기:

```markdown
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=owner&repo=repo)
```

## 파라미터

| 파라미터      | 설명                                                                  | 기본값 |
|---------------|-----------------------------------------------------------------------|--------|
| `username`    | 저장소 소유자 **(필수)**                                              | -      |
| `repo`        | 저장소 이름 **(필수)**                                                | -      |
| `theme`       | 카드 테마, [테마](#테마) 참고 (`auto`는 보는 사람의 기기 설정을 따름) | `auto` |
| `langs_count` | 표시할 언어 수 (최대 100, 나머지는 Other로 묶음)                      | `20`   |
| `width`       | 카드 너비(px) (최소 300, 최대 1000)                                   | `495`  |
| `precision`   | 퍼센트 소수점 자릿수 (0-6)                                            | `1`    |

## 예시

```markdown
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=vercel&repo=next.js&theme=dark)

![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=torvalds&repo=linux&langs_count=5)
```

## 테마

`auto`, `light`, `dark`, `github_dark_dimmed`, `dracula`, `nord`, `tokyonight`, `one_dark`, `monokai`, `gruvbox`, `gruvbox_light`, `solarized_dark`, `solarized_light`, `catppuccin_mocha`, `catppuccin_latte`, `rose_pine`

```md
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=vercel&repo=next.js&theme=tokyonight)
```

## 라이선스

[MIT](LICENSE)
