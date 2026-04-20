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
| `theme` | `light` or `dark` | `light` |
| `langs_count` | Number of languages to show (max 100, rest grouped as Other) | `20` |
| `width` | Card width in px (min 300, max 1000) | `495` |

## Examples

```markdown
![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=vercel&repo=next.js&theme=dark)

![Language Stats](https://github-repository-language-graph-wi.vercel.app/api?username=torvalds&repo=linux&langs_count=5)
```

## License

[MIT](LICENSE)
