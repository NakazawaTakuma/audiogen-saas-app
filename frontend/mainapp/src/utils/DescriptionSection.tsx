// DescriptionSection.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import styles from "./DescriptionSection.module.css";

type Props = { description: string };

const DescriptionSection: React.FC<Props> = ({ description }) => (
  <div className={styles.container}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      // 生の <script> 等を無視したいなら true
      skipHtml={true}
      // ← ここでは linkTarget を渡さず…
      components={{
        // aタグだけ override して target="_blank" を付与
        a: ({ node, children, href, ...props }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        ),
        // 必要なら他の要素もカスタマイズ可能
        // p: ({ node, children }) => <p className={styles.description}>{children}</p>,
      }}
    >
      {description}
    </ReactMarkdown>
  </div>
);

export default DescriptionSection;
