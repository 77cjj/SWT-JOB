import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";
import {
  SANITY_DATASET,
  SANITY_PREVIEW_URL,
  SANITY_PROJECT_ID,
  SANITY_STUDIO_BASE_PATH,
} from "./src/lib/sanity/env";

export default defineConfig({
  name: "default",
  title: "SWT Helper CMS",
  projectId: SANITY_PROJECT_ID || "missing-project-id",
  dataset: SANITY_DATASET || "production",
  basePath: SANITY_STUDIO_BASE_PATH,
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
  },
  document: {
    productionUrl: async (prev, context) => {
      const slug = context.document?.slug?.current;
      if (!slug) {
        return `${SANITY_PREVIEW_URL}/docs`;
      }

      return `${SANITY_PREVIEW_URL}/docs/${slug}`;
    },
  },
});
