import { defineField, defineType } from "sanity";

export const DOC_SECTION_OPTIONS = [
  { title: "入门必读", value: "intro" },
  { title: "报名选岗", value: "apply" },
  { title: "签证护照", value: "visa" },
  { title: "行前准备", value: "departure" },
  { title: "抵美落地", value: "arrival" },
  { title: "在美生活", value: "living" },
  { title: "交通出行", value: "transport" },
  { title: "归国收尾", value: "return" },
] as const;

export const docPageType = defineType({
  name: "docPage",
  title: "文档页面",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "标题",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "路径",
      type: "slug",
      options: {
        source: "title",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "section",
      title: "所属章节",
      type: "string",
      options: {
        list: [...DOC_SECTION_OPTIONS],
      },
    }),
    defineField({
      name: "sectionTitle",
      title: "章节标题",
      type: "string",
      description: "通常不需要手工填写，默认可与 section 保持一致。",
    }),
    defineField({
      name: "sectionOrder",
      title: "章节顺序",
      type: "number",
      initialValue: 999,
    }),
    defineField({
      name: "order",
      title: "文章顺序",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "summary",
      title: "摘要",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "status",
      title: "状态",
      type: "string",
      initialValue: "draft",
      options: {
        list: [
          { title: "草稿", value: "draft" },
          { title: "待审核", value: "review" },
          { title: "已发布", value: "published" },
        ],
      },
    }),
    defineField({
      name: "contentSource",
      title: "正文来源",
      type: "string",
      initialValue: "sanity",
      description:
        "Sanity：使用下方正文；服务器 / 仓库 MDX：使用同路径的站点兜底文档，Sanity 只负责启用和评论开关。",
      options: {
        layout: "radio",
        list: [
          { title: "Sanity", value: "sanity" },
          { title: "服务器 / 仓库 MDX", value: "server" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "enabled",
      title: "前台启用",
      type: "boolean",
      initialValue: true,
      description: "关闭后，该文档不会出现在目录、搜索和页面路由中。",
    }),
    defineField({
      name: "commentsEnabled",
      title: "开放评论区",
      type: "boolean",
      initialValue: true,
      description: "关闭后，前台隐藏这篇文档的评论区。",
    }),
    defineField({
      name: "body",
      title: "正文",
      type: "array",
      hidden: ({ document }) => document?.contentSource === "server",
      of: [
        { type: "block" },
        {
          type: "object",
          name: "code",
          title: "代码块",
          fields: [
            defineField({
              name: "language",
              title: "语言",
              type: "string",
            }),
            defineField({
              name: "code",
              title: "代码",
              type: "text",
              rows: 12,
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "seoTitle",
      title: "SEO 标题",
      type: "string",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO 描述",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "legacyPath",
      title: "原始文件路径",
      type: "string",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
      status: "status",
      enabled: "enabled",
      contentSource: "contentSource",
    },
    prepare({ title, subtitle, status, enabled, contentSource }) {
      return {
        title,
        subtitle: [
          enabled === false ? "已停用" : status,
          contentSource === "server" ? "服务器 / MDX" : "Sanity",
          subtitle,
        ].filter(Boolean).join(" · "),
      };
    },
  },
});
