import { defineField, defineType } from "sanity";

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
        list: [
          { title: "项目介绍", value: "intro" },
          { title: "行前准备", value: "preparation" },
          { title: "行中指南", value: "experience" },
          { title: "行后与归国", value: "after" },
          { title: "基础指南", value: "basics" },
        ],
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
      name: "body",
      title: "正文",
      type: "array",
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
    },
    prepare({ title, subtitle, status }) {
      return {
        title,
        subtitle: [status, subtitle].filter(Boolean).join(" · "),
      };
    },
  },
});
