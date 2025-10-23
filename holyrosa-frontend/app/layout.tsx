import { AuthProvider } from '@/context/AuthContext';
import { UIProvider } from '@/context/UIContext';
// import MSWInitializer from '@/components/MSWInitializer';
import { ToastContainer } from '@/components/ui/ToastContainer';
import '@/app/globals.css';

export const metadata = {
  title: 'Holy Rosary Pharmacy Management System',
  description: 'Pharmacy management system for Holy Rosary Pharmacy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('📄 RootLayout rendering...');
  return (
    <html lang="en">
      <body>
        {/* <MSWInitializer /> */}
        <AuthProvider>
          <UIProvider>
            <ToastContainer />
            {children}
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
