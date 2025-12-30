/// <reference types="vite/client" />

// Allow importing .mdx files as raw strings
declare module '*.mdx?raw' {
  const content: string;
  export default content;
}

// Allow importing .md files as raw strings
declare module '*.md?raw' {
  const content: string;
  export default content;
}

