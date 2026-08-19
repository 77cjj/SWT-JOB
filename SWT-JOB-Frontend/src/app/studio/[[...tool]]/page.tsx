/* eslint-disable react-refresh/only-export-components -- next-sanity 与页面同文件导出 metadata/viewport */
/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

import StudioClient from './StudioClient';
import { redirect } from "next/navigation";
import { getStudioHomePath } from "../../../lib/sanity/env";

// Studio 在开发态与鉴权态都依赖运行时能力，强制静态会导致路由卡住或白屏。
export const dynamic = 'force-dynamic';

export { metadata, viewport } from 'next-sanity/studio';

export default async function StudioPage({
  params,
}: {
  params: Promise<{ tool?: string[] }>;
}) {
  const resolvedParams = await params;
  const first = resolvedParams.tool?.[0];
  // 3.99 会自带 releases/tasks/comments；内容编辑在 structureTool。
  // 不要拦截 intent（「编辑本页」深链）或 structure 本身。
  if (!first || ["releases", "tasks", "comments"].includes(first)) {
    redirect(getStudioHomePath());
  }

  return <StudioClient />;
}
