import Navbar from './Navbar';
import Footer from '../Footer';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-10 md:pt-24 md:pb-16 bg-gradient-to-br from-brand-50 via-white to-orange-50">
        {children}
      </main>

      <Footer />
    </div>
  );
}
