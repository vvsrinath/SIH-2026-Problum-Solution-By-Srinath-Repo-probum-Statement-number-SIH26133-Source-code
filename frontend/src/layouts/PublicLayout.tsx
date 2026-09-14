import { Header } from '../components/navigation/Header';
import { Footer } from '../components/navigation/Footer';
import { AnimatedOutlet } from './AnimatedOutlet';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <Header />
      <main className="flex-1">
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>);

}