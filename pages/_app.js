// pages/_app.js
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/fonts.css';
import { Inter } from 'next/font/google';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import AddToHomeScreenModal from '../components/AddToHomeScreenModal';

const inter = Inter({ subsets: ['latin'] });

export default function MyApp({ Component, pageProps }) {
  const [isOffline, setIsOffline] = useState(false); // default to online

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateOnlineStatus(); // run once on mount

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      </Head>
      <main className={inter.className}>
        {isOffline && (
          <div className="bg-yellow-300 text-black p-4 text-center font-semibold z-50">
            ⚠️ You're currently offline. Please reconnect to use TaxTracker.
          </div>
        )}
       
        <Layout>
          <fieldset disabled={isOffline} className="w-full">
            <Component {...pageProps} />
          </fieldset>
        </Layout>
      </main>
    </>
  );
}