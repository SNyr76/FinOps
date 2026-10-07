import './globals.css';
export const metadata={ title: 'FinOps Atlas',description: 'Enterprise Azure cost intelligence' };
export default function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) { return <html lang="en"><body>{children}</body></html>; }
