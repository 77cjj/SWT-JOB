export function toChineseTitle(raw: string): string {
  let next = raw.trim();

  // 去掉标题末尾的括号后缀：例如 “机构与费用 (Agencies & Costs)” / “机构与费用（Agencies & Costs）”
  while (/[（(][^（）()]*[）)]\s*$/.test(next)) {
    next = next.replace(/\s*[（(][^（）()]*[）)]\s*$/, "").trim();
  }

  return next || raw;
}
