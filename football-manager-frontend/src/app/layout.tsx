import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import SiteHeader from "./components/header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SiteHeader /> 
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
