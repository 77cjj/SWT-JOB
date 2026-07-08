/* eslint-disable react-refresh/only-export-components */
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { DocPage } from "../../components/docs/DocPage";
import { getDocBySlug, getDocsNavigation } from "../../lib/docs/content";
import { prepareDocPage } from "../../lib/docs/headings";

export const getStaticProps: GetStaticProps = async () => {
  const [page, navigation] = await Promise.all([
    getDocBySlug([]),
    getDocsNavigation(),
  ]);

  if (!page) {
    return { notFound: true, revalidate: 60 };
  }

  const prepared = prepareDocPage(page);

  return {
    props: {
      page: JSON.parse(JSON.stringify(prepared)),
      navigation: JSON.parse(JSON.stringify(navigation)),
    },
    revalidate: 60,
  };
};

export default function DocsIndexPage({
  page,
  navigation,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <DocPage page={page} navigation={navigation} />;
}
