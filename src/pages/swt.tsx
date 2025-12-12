import type { GetServerSideProps } from 'next'

const SWTPage = () => null

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/docs',
      permanent: false,
    },
  }
}

export default SWTPage


