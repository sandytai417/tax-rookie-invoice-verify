import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tax Rookie｜報稅菜鳥 | Invoice Verify',
  description:
    '報稅菜鳥｜發票驗算工具。Verify net, tax, and gross amounts locally in your browser.',
  other: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Lock mobile spreadsheet UI early so tab switches / landscape do not flash desktop grid. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="tax-rookie-touch-ui";var q=window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)");if(q.matches||sessionStorage.getItem(k)==="1"){document.documentElement.classList.add("touch-ui");sessionStorage.setItem(k,"1");}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
