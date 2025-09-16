import type { AppProps } from 'next/app';
import '../styles.css';
import KeyboardShortcuts from '../components/KeyboardShortcuts';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <KeyboardShortcuts />
    </>
  );
}
