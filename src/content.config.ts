import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const text = z.string().trim().min(1);

const homepage = defineCollection({
  loader: glob({ pattern: "home.md", base: "./src/content/homepage" }),
  schema: z.object({
    title: text,
    eyebrow: text,
    headline: text,
    summary: text,
    image: text.regex(
      /^\/images\/.+$/,
      "Use a public image path: /images/filename",
    ),
    imageAlt: text,
    imageCaption: text,
    ctaLabel: text,
    ctaLink: text.regex(
      /^(\/(?!\/)|#[^\s]|https:\/\/)[^\s]*$/,
      "Use a site path, #anchor, or https:// link",
    ),
    aboutEyebrow: text,
    aboutHeadline: text,
    cards: z.array(z.object({ title: text, summary: text })).length(3),
  }),
});

const pages = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: "./src/content/pages",
    // The filename is the URL, even if an editor adds a slug field.
    generateId: ({ entry }) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(entry)) {
        throw new Error(
          `Use a lowercase, hyphen-separated page filename: ${entry}`,
        );
      }
      return entry.replace(/\.md$/, "");
    },
  }),
  schema: z.object({ title: text, summary: text }),
});

export const collections = { homepage, pages };
