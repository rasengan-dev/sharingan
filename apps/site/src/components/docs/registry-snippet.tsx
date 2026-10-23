import { useEffect, useState } from 'react';
import { CodeFigure, CodePre, CodeTitle } from '@/components/mdx/code-block';

/** The registry lives wherever this site is served: the snippets show its real address. */
function useOrigin() {
  const [origin, setOrigin] = useState('https://your-sharingan-site');
  useEffect(() => setOrigin(window.location.origin), []);
  return origin;
}

/** A block like the docs' highlighted ones (same header, frame and copy button), for text built at runtime. */
function Snippet({ title, language, children }: { title: string; language: string; children: string }) {
  return (
    <CodeFigure>
      <CodeTitle data-language={language}>{title}</CodeTitle>
      <CodePre>
        <code data-language={language}>
          {children.split('\n').map((line, index) => (
            <span key={index} data-line="">
              {line}
            </span>
          ))}
        </code>
      </CodePre>
    </CodeFigure>
  );
}

/** The `registries` entry for components.json. Usable in MDX as `<RegistryConfig />`. */
export function RegistryConfig() {
  const origin = useOrigin();
  return (
    <Snippet title="components.json" language="json">{`{\n  "registries": {\n    "@sharingan": "${origin}/r/{name}.json"\n  }\n}`}</Snippet>
  );
}

/** Installing a hero by its full address, without the registry entry. Usable in MDX as `<InstallByUrl name="…" />`. */
export function InstallByUrl({ name }: { name: string }) {
  const origin = useOrigin();
  return (
    <Snippet title="Terminal" language="bash">
      {`npx shadcn@latest add ${origin}/r/${name}.json`}
    </Snippet>
  );
}
