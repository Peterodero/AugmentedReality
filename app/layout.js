import "./globals.css";

export const metadata = {
  title: "Safaricom AR Game Scanner",
  description: "Scan the Safaricom logo at event booths to unlock instant random games!",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#07120C] text-gray-100 antialiased selection:bg-[#00A651] selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
