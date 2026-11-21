import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

function remarkHeadingIds() {
  return (tree) => {
    for (const heading of tree.children) {
      if (heading.type !== 'heading') continue;
      const tail = heading.children.at(-1);
      if (tail?.type !== 'text') continue;
      const id = tail.value.match(/\s+\[#([a-z][a-z0-9-]*)\]$/);
      if (!id) continue;

      tail.value = tail.value.slice(0, id.index);
      heading.data ??= {};
      heading.data.hProperties = { ...heading.data.hProperties, id: id[1] };
    }
  };
}

export default defineConfig({
  output: 'static',
  redirects: { '/projects/tuan-chat-replay/': '/projects/webgal-effects/' },
  integrations: [mdx({ remarkPlugins: [remarkHeadingIds] })],
  vite: { plugins: [tailwindcss()] },
});
