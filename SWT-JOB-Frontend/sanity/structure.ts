import type { StructureResolver } from "sanity/structure";

const sectionDefs = [
  { key: "intro", title: "入门必读" },
  { key: "apply", title: "报名选岗" },
  { key: "visa", title: "签证护照" },
  { key: "departure", title: "行前准备" },
  { key: "arrival", title: "抵美落地" },
  { key: "living", title: "在美生活" },
  { key: "transport", title: "交通出行" },
  { key: "return", title: "归国收尾" },
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
