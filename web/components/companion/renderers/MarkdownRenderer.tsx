import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { MarkdownData } from "@/lib/dwic/types";

export function MarkdownRenderer({ data }: { data: MarkdownData }) {
  return (
    <div>
      {data.title ? (
        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.75rem", color: "#fff" }}>
          {data.title}
        </h3>
      ) : null}
      <div
        style={{
          fontSize: "0.9rem",
          color: "rgba(255,255,255,0.85)",
          lineHeight: 1.6,
        }}
        className="dwic-markdown"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown>
      </div>
    </div>
  );
}
