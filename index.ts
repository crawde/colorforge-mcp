#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.COLORFORGE_API_URL || "https://colorforge.site";
const API_KEY = process.env.COLORFORGE_API_KEY || "";

const headers = (extra?: Record<string, string>) => ({
  "Content-Type": "application/json",
  ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  ...extra,
});

const server = new McpServer({
  name: "colorforge",
  version: "0.1.0",
});

server.tool(
  "generate_coloring_page",
  "Generate a black-and-white coloring page from a natural language description. Returns a clean line art PNG ready for printing or digital coloring.",
  {
    subject: z.string().describe("What to draw — describe the scene, character, or object. E.g. 'a dragon flying over a castle', 'tropical fish in a coral reef', 'mandala with flowers'"),
    theme: z.string().optional().describe("Theme category: animals, flowers, fantasy, vehicles, patterns, nature, food, holidays"),
    complexity: z.enum(["simple", "medium", "detailed"]).optional().describe("Line art complexity. simple = young kids, medium = older kids/casual, detailed = adults. Default: medium"),
    lineStyle: z.enum(["bold", "thin", "mixed"]).optional().describe("Line thickness style. bold = easy to color, thin = fine detail, mixed = varied. Default: bold"),
    pageSize: z.enum(["letter", "a4", "square"]).optional().describe("Output page proportions. Default: letter"),
  },
  async ({ subject, theme, complexity, lineStyle, pageSize }) => {
    const prompt = `A coloring page of ${subject}, black and white line art, clean simple outlines only, no shading, no filled areas, suitable for coloring book, white background, high contrast lines`;

    const res = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        prompt,
        userPrompt: subject,
        theme,
        complexity,
        lineStyle,
        pageSize,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      const errMsg = error.error || res.statusText;

      if (res.status === 402 || errMsg.includes("limit")) {
        return {
          content: [{
            type: "text",
            text: `Free coloring page limit reached (3/day). Upgrade to Pro ($4.99/mo) at https://colorforge.site/pricing\n\nSetup: Add COLORFORGE_API_KEY to your MCP config env vars.`,
          }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: `Error: ${errMsg}` }],
        isError: true,
      };
    }

    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const galleryId = res.headers.get("X-Gallery-Id");

    return {
      content: [
        {
          type: "image",
          data: base64,
          mimeType: "image/png",
        },
        {
          type: "text",
          text: `Coloring page generated: "${subject}"${complexity ? ` (${complexity})` : ""}${galleryId ? `\nGallery ID: ${galleryId}` : ""}\n\nPrint this page or save the PNG for digital coloring.`,
        },
      ],
    };
  }
);

server.tool(
  "browse_gallery",
  "Browse the public coloring page gallery to find existing pages by theme.",
  {
    theme: z.string().optional().describe("Filter by theme: animals, flowers, fantasy, vehicles, patterns, nature, food, holidays"),
    limit: z.number().optional().describe("Number of results to return. Default: 24"),
    offset: z.number().optional().describe("Pagination offset. Default: 0"),
  },
  async ({ theme, limit, offset }) => {
    const params = new URLSearchParams();
    if (theme) params.set("theme", theme);
    if (limit) params.set("limit", String(limit));
    if (offset) params.set("offset", String(offset));

    const res = await fetch(`${API_BASE}/api/gallery?${params}`, {
      headers: headers(),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      return {
        content: [{ type: "text", text: `Error: ${error.error || res.statusText}` }],
        isError: true,
      };
    }

    const data = await res.json();
    const items = data.items || [];

    if (!items.length) {
      return {
        content: [{ type: "text", text: `No coloring pages found${theme ? ` for theme "${theme}"` : ""}. Try generating a new one!` }],
      };
    }

    const listing = items.map((item: any, i: number) => {
      const meta = [item.complexity, item.lineStyle].filter(Boolean).join(", ");
      return `${i + 1}. **${item.prompt || item.userPrompt || "Untitled"}**${meta ? ` (${meta})` : ""}`;
    }).join("\n");

    return {
      content: [{
        type: "text",
        text: `Coloring Page Gallery${theme ? ` — "${theme}"` : ""} (${items.length} of ${data.total || items.length}):\n\n${listing}`,
      }],
    };
  }
);

server.tool(
  "check_usage",
  "Check how many free coloring page generations remain for today.",
  {},
  async () => {
    const res = await fetch(`${API_BASE}/api/usage`, {
      headers: headers(),
    });

    if (!res.ok) {
      return {
        content: [{ type: "text", text: "Unable to check usage. Try generating a page to see your limit." }],
      };
    }

    const data = await res.json();

    let text = `Generations today: ${data.used || 0}`;
    if (data.remaining !== undefined) text += ` / Remaining: ${data.remaining}`;
    if (data.pro) text += "\nPro account — unlimited generations";
    if (!data.pro && data.remaining === 0) text += `\n\nUpgrade to Pro ($4.99/mo) at https://colorforge.site/pricing`;

    return { content: [{ type: "text", text }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
