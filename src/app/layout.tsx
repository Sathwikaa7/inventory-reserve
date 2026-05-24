import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Inventory Reserve Pro",
  description: "Professional inventory reservation management system with real-time tracking",
  keywords: "inventory, reservation, management, warehouse, stock",
  authors: [{ name: "Inventory Reserve Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="h-full bg-white antialiased">
        <div className="min-h-full flex flex-col">
          <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 sticky top-0 z-50 shadow-xl">
            {/* Animated background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 animate-pulse"></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-24">
                <div className="flex items-center space-x-6">
                  {/* Enhanced Logo */}
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300">
                      <div className="absolute inset-0 bg-white/20 rounded-2xl backdrop-blur-sm"></div>
                      <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 w-14 h-14 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl blur-lg opacity-50 -z-10"></div>
                  </div>
                  
                  {/* Enhanced Title */}
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-emerald-100 bg-clip-text text-transparent">
                      Inventory Reserve Pro
                    </h1>
                    <p className="text-blue-200 text-sm font-medium">
                      🚀 Professional inventory management system
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Status Indicators */}
                <div className="flex items-center space-x-6">
                  {/* Live System Status */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center space-x-3 shadow-lg">
                    <div className="relative">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                    <span className="text-sm font-semibold text-emerald-100">Live System</span>
                  </div>
                  
                  {/* Update Frequency */}
                  <div className="hidden sm:flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
                    <svg className="w-4 h-4 text-blue-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-xs font-medium text-blue-200">Updates every 10s</span>
                  </div>
                  
                  {/* Stats Badge */}
                  <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-semibold text-white">Real-time Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">&copy; 2024 Inventory Reserve Pro. Professional inventory management system.</p>
                </div>
                <div className="hidden sm:flex items-center space-x-4 text-xs text-gray-500">
                  <span>Real-time tracking</span>
                  <span>•</span>
                  <span>Secure reservations</span>
                  <span>•</span>
                  <span>Professional grade</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
        <Toaster 
          richColors 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              borderRadius: '12px',
              fontSize: '14px',
            }
          }}
        />
      </body>
    </html>
  );
}