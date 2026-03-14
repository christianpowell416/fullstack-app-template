import type { Metadata } from 'next'
import { Inter, Space_Grotesk, Krona_One } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })
const kronaOne = Krona_One({ weight: '400', subsets: ['latin'], variable: '--font-krona' })

export const metadata: Metadata = {
  title: 'Mavericks - Recruiting Dashboard',
  description: 'AI-powered recruiting platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else{document.documentElement.setAttribute('data-theme','dark')}}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${kronaOne.variable} ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}
