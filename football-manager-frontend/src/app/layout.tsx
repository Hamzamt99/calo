import './globals.css';
import Link from 'next/link';
import { AuthProvider } from '../lib/auth-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <span className="text-xl font-bold text-blue-600">FM Logo</span>
                </Link>
              </div>
              <nav className="flex space-x-6">
                <Link href="/team" className="text-gray-700 hover:text-blue-600 font-medium">
                  Teams
                </Link>
                <Link href="/market" className="text-gray-700 hover:text-blue-600 font-medium">
                  Market
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
