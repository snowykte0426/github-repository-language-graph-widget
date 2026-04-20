# GitHub Repository Language Graph

SVG language statistics widget for a **specific GitHub repository** — embed in any README.

## Usage

```
https://your-domain.vercel.app/api?username={owner}&repo={repo}
```

Embed in your README:

```markdown
![Language Stats](https://your-domain.vercel.app/api?username=owner&repo=repo)
```

## Parameters

| Parameter | Description | Default |
|---|---|---|
| `username` | Repository owner **(required)** | — |
| `repo` | Repository name **(required)** | — |
| `theme` | `light` or `dark` | `light` |
| `langs_count` | Number of languages to show (max 100, rest grouped as Other) | `20` |

## Examples

```markdown
![Language Stats](https://your-domain.vercel.app/api?username=vercel&repo=next.js&theme=dark)

![Language Stats](https://your-domain.vercel.app/api?username=torvalds&repo=linux&langs_count=5)
```

## License

[MIT](LICENSE)
