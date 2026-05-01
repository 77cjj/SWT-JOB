import type { StructureResolver } from "sanity/structure";

const sectionDefs = [
  { key: "intro", title: "项目介绍" },
  { key: "preparation", title: "行前准备" },
  { key: "experience", title: "行中指南" },
  { key: "after", title: "行后与归国" },
  { key: "basics", title: "基础指南" },
] as const;

export const structure: StructureResolver = (S) =>
  S.list()
    .id("root-content")
    .title("内容管理")
    .items([
      S.listItem()
        .id("all-doc-pages")
        .title("全部文档")
        .child(
          S.documentTypeList("docPage")
            .id("all-doc-pages-list")
            .title("全部文档"),
        ),
      ...sectionDefs.map((section) =>
        S.listItem()
          .id(`section-${section.key}`)
          .title(section.title)
          .child(
            S.documentList()
              .id(`doc-list-${section.key}`)
              .title(section.title)
              .schemaType("docPage")
              .filter('_type == "docPage" && section == $section')
              .params({ section: section.key }),
          ),
      ),
    ]);
