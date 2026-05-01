export const allDocPagesQuery = `*[_type == "docPage"] | order(sectionOrder asc, order asc, title asc) {
  _id,
  title,
  "slugCurrent": slug.current,
  section,
  sectionTitle,
  sectionOrder,
  order,
  status,
  summary,
  body,
  seoTitle,
  seoDescription,
  legacyPath,
  _updatedAt
}`;

export const allDocPagesNavQuery = `*[_type == "docPage"] | order(sectionOrder asc, order asc, title asc) {
  _id,
  title,
  "slugCurrent": slug.current,
  section,
  sectionTitle,
  sectionOrder,
  order,
  status,
  summary,
  seoTitle,
  seoDescription,
  legacyPath,
  _updatedAt
}`;

export const docPageBySlugQuery = `*[_type == "docPage" && slug.current == $slug][0]{
  _id,
  title,
  "slugCurrent": slug.current,
  section,
  sectionTitle,
  sectionOrder,
  order,
  status,
  summary,
  body,
  seoTitle,
  seoDescription,
  legacyPath,
  _updatedAt
}`;
