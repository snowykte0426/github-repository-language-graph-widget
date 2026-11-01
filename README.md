# GitHub Repository Language Graph

English | [한국어](README.ko.md)

SVG language statistics widget for a **specific GitHub repository**. Embed it in any README.

![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=snowykte0426&repo=github-repository-language-graph-widget)

## Usage

```
https://github-repository-language-graph-wi.vercel.app/api?username={owner}&repo={repo}
```

Embed in your README:

```markdown
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=owner&repo=repo)
```

## Parameters

| Parameter     | Description                                                                        | Default |
|---------------|------------------------------------------------------------------------------------|---------|
| `username`    | Repository owner **(required)**                                                    | -       |
| `repo`        | Repository name **(required)**                                                     | -       |
| `theme`       | Card theme, see [Themes](#themes) (`auto` follows the viewer's device preference)  | `auto`  |
| `langs_count` | Number of languages to show (max 100, rest grouped as Other)                       | `20`    |
| `width`       | Card width in px (min 300, max 1000)                                               | `495`   |
| `precision`   | Decimal places for percentages (0-6)                                               | `1`     |

## Examples

```markdown
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=vercel&repo=next.js&theme=dark)

![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=torvalds&repo=linux&langs_count=5)
```

## Themes

`auto`, `light`, `dark`, `github_dark_dimmed`, `dracula`, `nord`, `tokyonight`, `one_dark`, `monokai`, `gruvbox`, `gruvbox_light`, `solarized_dark`, `solarized_light`, `catppuccin_mocha`, `catppuccin_latte`, `rose_pine`

```md
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=vercel&repo=next.js&theme=tokyonight)
```

## License

[MIT](LICENSE)
