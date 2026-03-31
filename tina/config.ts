import { defineConfig, LocalAuthProvider } from "tinacms";

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "master";
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const docFields = [
  {
    type: "string" as const,
    name: "title",
    label: "标题",
    required: false,
  },
  {
    type: "rich-text" as const,
    name: "body",
    label: "正文",
    isBody: true,
  },
];

export default defineConfig({
  branch,
  contentApiUrlOverride: isLocal ? "/api/tina/gql" : undefined,
  authProvider: isLocal ? new LocalAuthProvider() : undefined,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "docsHome",
        label: "文档首页",
        path: "src/pages/docs",
        format: "mdx",
        match: {
          include: "index",
        },
        ui: {
          router: () => "/docs",
        },
        fields: docFields,
      },
      {
        name: "intro",
        label: "项目介绍",
        path: "src/pages/docs/intro",
        format: "mdx",
        match: {
          include: "*",
        },
        ui: {
          router: ({ document }) => `/docs/intro/${document._sys.filename}`,
        },
        fields: docFields,
      },
      {
        name: "preparation",
        label: "行前准备",
        path: "src/pages/docs/preparation",
        format: "mdx",
        match: {
          include: "*",
        },
        ui: {
          router: ({ document }) =>
            `/docs/preparation/${document._sys.filename}`,
        },
        fields: docFields,
      },
      {
        name: "experience",
        label: "行中指南",
        path: "src/pages/docs/experience",
        format: "mdx",
        match: {
          include: "*",
        },
        ui: {
          router: ({ document }) => `/docs/experience/${document._sys.filename}`,
        },
        fields: docFields,
      },
      {
        name: "after",
        label: "行后与归国",
        path: "src/pages/docs/after",
        format: "mdx",
        match: {
          include: "*",
        },
        ui: {
          router: ({ document }) => `/docs/after/${document._sys.filename}`,
        },
        fields: docFields,
      },
      {
        name: "basics",
        label: "基础指南",
        path: "src/pages/docs/basics",
        format: "mdx",
        match: {
          include: "*",
        },
        ui: {
          router: ({ document }) => `/docs/basics/${document._sys.filename}`,
        },
        fields: docFields,
      },
    ],
  },
});
