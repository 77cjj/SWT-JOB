import { defineCliConfig } from "sanity/cli";

import {
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from "./src/lib/sanity/env";

export default defineCliConfig({
  api: {
    projectId: SANITY_PROJECT_ID || "missing-project-id",
    dataset: SANITY_DATASET || "production",
  },
});
