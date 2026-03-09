import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto bg-background transition-all duration-300 lg:ml-64">
        <div className="min-h-screen p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
