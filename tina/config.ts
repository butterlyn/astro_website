import { beforeSubmit } from "./reservation";
import {
  defineConfig,
  LocalAuthProvider,
  type Collection,
  type TinaField,
} from "tinacms";

const branch = "development";
if (typeof window === "undefined" && process.env.TINA_BRANCH !== branch)
  throw new Error("TINA_BRANCH must explicitly equal development.");
const local = process.env.TINA_PUBLIC_IS_LOCAL === "true";
if (
  typeof window === "undefined" &&
  !local &&
  (!process.env.TINA_PUBLIC_CLIENT_ID || !process.env.TINA_TOKEN)
) {
  throw new Error(
    "Set TINA_PUBLIC_CLIENT_ID and TINA_TOKEN for TinaCloud. See docs/tina-setup.md.",
  );
}

const link = {
  type: "object",
  name: "link",
  label: "Link",
  fields: [
    { type: "string", name: "label", label: "Link text", required: true },
    {
      type: "string",
      name: "href",
      label: "Destination",
      required: true,
      description: "Use a site path starting with / or an https:// address.",
    },
  ],
} satisfies TinaField;

const proofPage: Collection = {
  name: "proofPage",
  label: "Integration proof pages",
  path: "content/proof/pages",
  format: "md",
  ui: { beforeSubmit, router: () => "/editing-proof/" },
  fields: [
    {
      type: "string",
      name: "title",
      label: "Page title",
      isTitle: true,
      required: true,
    },
    {
      type: "string",
      name: "description",
      label: "Description",
      required: true,
    },
    {
      type: "image",
      name: "image",
      label: "Image",
      description: "Only upload files approved for public exposure.",
    },
    { type: "string", name: "imageAlt", label: "Image alternative text" },
    {
      type: "object",
      name: "sections",
      label: "Sections",
      list: true,
      templates: [
        {
          name: "featureGrid",
          label: "Feature cards",
          fields: [
            {
              type: "string",
              name: "id",
              label: "Stable section ID",
              required: true,
              description:
                "Keep this ID when reordering so feedback still identifies the section.",
            },
            {
              type: "string",
              name: "heading",
              label: "Heading",
              required: true,
            },
            {
              type: "string",
              name: "theme",
              label: "Theme",
              options: ["light", "accent"],
              required: true,
            },
            {
              type: "object",
              name: "items",
              label: "Cards",
              list: true,
              ui: { itemProps: (item) => ({ label: item?.heading }) },
              fields: [
                {
                  type: "string",
                  name: "id",
                  label: "Stable card ID",
                  required: true,
                },
                {
                  type: "string",
                  name: "heading",
                  label: "Card heading",
                  required: true,
                },
                {
                  type: "string",
                  name: "description",
                  label: "Card text",
                  required: true,
                },
                link,
              ],
            },
          ],
        },
      ],
    },
    { type: "rich-text", name: "body", label: "Page text", isBody: true },
  ],
};

export default defineConfig({
  branch,
  // `tinacms build --local` starts the local API but builds the admin with
  // its production URL. Explicitly connect this local-only proof to the CLI.
  ...(local
    ? {
        contentApiUrlOverride: "http://localhost:4001/graphql",
        authProvider: new LocalAuthProvider(),
      }
    : {}),
  clientId: process.env.TINA_PUBLIC_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: { outputFolder: "admin", publicFolder: ".build/public-editing" },
  media: { tina: { publicFolder: "public", mediaRoot: "uploads" } },
  schema: {
    collections: [
      proofPage,
      {
        name: "proofGlobal",
        label: "Shared proof navigation and footer",
        path: "content/proof/globals",
        format: "md",
        ui: {
          beforeSubmit,
          allowedActions: { create: false, delete: false },
          router: () => "/editing-proof/",
        },
        fields: [
          { type: "string", name: "name", label: "Site name", required: true },
          {
            ...link,
            name: "navigation",
            label: "Navigation links",
            list: true,
          },
          {
            type: "string",
            name: "footer",
            label: "Footer text",
            required: true,
          },
        ],
      },
    ],
  },
});
