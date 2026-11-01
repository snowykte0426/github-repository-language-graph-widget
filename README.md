# GitHub Repository Language Graph

SVG language statistics widget for a **specific GitHub repository** — embed in any README.

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

| Parameter | Description | Default |
|---|---|---|
| `username` | Repository owner **(required)** | — |
| `repo` | Repository name **(required)** | — |
| `theme` | `light`, `dark`, or `auto` (`auto` follows the viewer's device preference) | `light` |
| `langs_count` | Number of languages to show (max 100, rest grouped as Other) | `20` |
| `width` | Card width in px (min 300, max 1000) | `495` |
| `precision` | Decimal places for percentages (0–6) | `1` |

## Examples

```markdown
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=vercel&repo=next.js&theme=dark)

![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=torvalds&repo=linux&langs_count=5)

![Language Stats with two decimal places](https://github-repository-language-graph-wi.vercel.app/api?username=owner&repo=repo&precision=2)

![Aheui language stats](https://github-repository-language-graph-wi.vercel.app/api?username=aheui&repo=aheui.aheui)
```

## License

[MIT](LICENSE)
