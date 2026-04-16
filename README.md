# ColorForge MCP Server

Generate AI coloring pages from natural language through any MCP-compatible AI assistant.

## What is ColorForge?

[ColorForge](https://colorforge.site) generates beautiful black-and-white coloring pages from simple descriptions. Describe any scene, animal, pattern, or character and get clean line art ready for printing or digital coloring. Perfect for kids, adults, teachers, and coloring book creators.

## Tools

| Tool | Description |
|------|-------------|
| `generate_coloring_page` | Generate a coloring page from a description |
| `browse_gallery` | Browse public gallery by theme |
| `check_usage` | Check remaining free generations today |

## Quick Start

```bash
npx @crawde/colorforge-mcp
```

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "colorforge": {
      "command": "npx",
      "args": ["-y", "@crawde/colorforge-mcp"],
      "env": {
        "COLORFORGE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage Examples

- "Generate a coloring page of a dragon flying over a castle"
- "Create a simple coloring page of a cute puppy for a 4 year old"
- "Make a detailed mandala coloring page for adults"
- "Browse animal coloring pages in the gallery"

## Free Tier

- 3 coloring pages per day
- Gallery browsing unlimited
- Pro ($4.99/mo) for unlimited at [colorforge.site/pricing](https://colorforge.site/pricing)

## License

MIT
