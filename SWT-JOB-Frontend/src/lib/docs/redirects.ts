/** 旧文档 slug → 新 slug，保证历史链接可用 */
export const DOC_SLUG_REDIRECTS: Record<string, string> = {
  // intro
  "intro/guide": "apply/selection",
  "intro/policy-212e": "intro/faq",

  // preparation → visa / departure / apply
  "preparation/agency": "apply/agency",
  "preparation/timeline": "apply/timeline",
  journey: "apply/timeline",
  "preparation/interview": "apply/interview",
  "preparation/flights": "departure/flights",
  "preparation/packing": "departure/packing",
  "preparation/documents-visa/passport/doc-007": "visa/passport-lost",
  "preparation/documents-visa/passport/doc-008": "visa/passport",
  "preparation/documents-visa/policy/doc-009": "intro/faq",
  "preparation/documents-visa/visa/doc-010": "visa/visa-faq",
  "preparation/documents-visa/visa-process/doc-011": "visa/visa-interview",
  "preparation/pre-departure/sim/doc-015": "departure/sim-card",
  "preparation/pre-departure/topic-016/doc-016": "departure/money-prep",
  "preparation/pre-departure/cost/doc-018": "intro/project-costs",

  // experience → apply / living / transport / arrival
  "experience/roles": "apply/roles",
  "experience/selection": "apply/selection",
  "experience/living-cost": "living/living-cost",
  "experience/second-job": "living/second-job",
  "experience/arrival/arrival/doc-019": "arrival/arrival-guide",
  "experience/arrival/arrival-process/doc-020": "arrival/sevis-checkin",
  "experience/transport-lodging/housing/doc-022": "living/housing",
  "experience/transport-lodging/uber/doc-021": "transport/uber",
  "experience/transport-lodging/bus/doc-023": "transport/bus",
  "experience/transport-lodging/metro/doc-024": "transport/metro",
  "experience/transport-lodging/coach/doc-025": "transport/coach",
  "experience/transport-lodging/train/doc-026": "transport/train",
  "experience/transport-lodging/car-rental/doc-027": "transport/car-rental",
  "experience/transport-lodging/bicycle/doc-028": "transport/bicycle",
  "experience/work-life/shopping/doc-029": "living/reselling",
  "experience/work-life/medical/doc-030": "living/medical",
  "experience/work-life/work-rules/doc-031": "living/work-rules",
  "experience/work-life/travel/doc-032": "transport/domestic-travel",
  "experience/work-life/food/doc-033": "living/food",
  "experience/safety-emergency/safety/doc-034": "living/safety",

  // after → return / living
  "after/taxes": "return/taxes",
  "after/shopping": "return/side-hustles",
  "after/travel": "return/grace-travel",

  // basics → departure
  "basics/flights": "departure/flights",
  "basics/platform-communication/whatsapp/doc-001": "departure/whatsapp",
  "basics/platform-communication/guides/doc-002": "departure/online-tools",
  "basics/platform-communication/guides/doc-003": "departure/online-tools",
  "basics/platform-communication/guides/doc-004": "departure/online-tools",
  "basics/platform-communication/guides/doc-005": "departure/online-tools",
  "basics/platform-communication/communication/doc-006": "departure/email-templates",

  // Sanity cleaned 导入 slug → 手写 MDX canonical
  "basics/cleaned/platform-communication/whatsapp/doc-001": "departure/whatsapp",
  "basics/cleaned/platform-communication/usage-guide/google-meet": "departure/online-tools",
  "basics/cleaned/platform-communication/usage-guide/skype": "departure/online-tools",
  "basics/cleaned/platform-communication/usage-guide/teams": "departure/online-tools",
  "basics/cleaned/platform-communication/usage-guide/zoom": "departure/online-tools",
  "basics/cleaned/platform-communication/communication-template/doc-006":
    "departure/email-templates",
  "preparation/cleaned/documents-visa/passport/doc-007": "visa/passport-lost",
  "preparation/cleaned/documents-visa/passport/doc-008": "visa/passport",
  "preparation/cleaned/documents-visa/policy/j1-212e": "intro/faq",
  "preparation/cleaned/documents-visa/visa/doc-010": "visa/visa-faq",
  "preparation/cleaned/documents-visa/visa-process/j1": "visa/visa-interview",
  "preparation/cleaned/pre-departure/flight-boarding/doc-012": "departure/flights",
  "preparation/cleaned/pre-departure/flight-ticket/v2": "departure/flights",
  "preparation/cleaned/pre-departure/flight-ticket/doc-014": "departure/flights",
  "preparation/cleaned/pre-departure/sim-card/doc-015": "departure/sim-card",
  "preparation/cleaned/pre-departure/packing/doc-017": "departure/packing",
  "preparation/cleaned/pre-departure/cost-estimation/doc-018": "intro/project-costs",
  "experience/cleaned/arrival/arrival/doc-019": "arrival/arrival-guide",
  "experience/cleaned/arrival/arrival-process/doc-020": "arrival/sevis-checkin",
  "experience/cleaned/transport-lodging/uber/doc-021": "transport/uber",
  "experience/cleaned/transport-lodging/housing/doc-022": "living/housing",
  "experience/cleaned/transport-lodging/bus-city/doc-023": "transport/bus",
  "experience/cleaned/transport-lodging/metro/doc-024": "transport/metro",
  "experience/cleaned/transport-lodging/intercity-bus/doc-025": "transport/coach",
  "experience/cleaned/transport-lodging/train/v2": "transport/train",
  "experience/cleaned/transport-lodging/car-rental/doc-027": "transport/car-rental",
  "experience/cleaned/transport-lodging/bicycle/v2": "transport/bicycle",
  "experience/cleaned/work-life/shopping-agent/doc-029": "living/reselling",
  "experience/cleaned/work-life/medical-care/doc-030": "living/medical",
  "experience/cleaned/work-life/work-rules/doc-031": "living/work-rules",
  "experience/cleaned/work-life/travel/doc-032": "transport/domestic-travel",
  "experience/cleaned/work-life/food/doc-033": "living/food",
  "experience/cleaned/safety-emergency/safety/doc-034": "living/safety",
  "experience/cleaned/safety-emergency/safety/doc-035": "living/safety",
};

export function resolveDocSlugRedirect(slug: string[]): string[] | null {
  const key = slug.join("/");
  const target = DOC_SLUG_REDIRECTS[key];
  return target ? target.split("/") : null;
}
