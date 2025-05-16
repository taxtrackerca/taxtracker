// pages/_app.js or _app.tsx
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/fonts.css';
import { Inter } from 'next/font/google';
import Layout from '../components/Layout';

const inter = Inter({ subsets: ['latin'] });

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      </Head>
      <main className={inter.className}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </main>
    </>
  );
}