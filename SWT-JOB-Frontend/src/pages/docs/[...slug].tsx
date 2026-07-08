/* eslint-disable react-refresh/only-export-components */
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";

import { DocPage } from "../../components/docs/DocPage";
import { getAllDocPaths, getDocBySlug, getDocsNavigation } from "../../lib/docs/content";
import { prepareDocPage } from "../../lib/docs/headings";
import { DOC_SLUG_REDIRECTS } from "../../lib/docs/redirects";

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await getAllDocPaths();
  const docPaths = paths
    .filter((slug) => slug.length > 0)
    .map((slug) => ({ params: { slug } }));

  return {
    paths: docPaths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params.slug : [];
  const slugKey = slug.join("/");

  if (DOC_SLUG_REDIRECTS[slugKey]) {
    return {
      redirect: {
        destination: `/docs/${DOC_SLUG_REDIRECTS[slugKey]}`,
        permanent: true,
      },
    };
  }

  const [page, navigation] = await Promise.all([
    getDocBySlug(slug),
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

export default function DocsSlugPage({
  page,
  navigation,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return <DocPage page={page} navigation={navigation} />;
}
