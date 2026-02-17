import ReactMarkdown from "react-markdown";

type Props = {
  markdown: string;
};

export function Markdown({ markdown }: Props) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}