import { Link } from "@heroui/link";
import { Navbar } from "@/components/navbar";
import { Outlet } from "react-router-dom"; // <--- Import Outlet

export default function DefaultLayout() { // <--- Remove 'children' prop from here
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow pt-16">
        <Outlet /> {/* <--- Render Outlet instead of children */}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://heroui.com"
          title="heroui.com homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">HeroUI</p>
        </Link>
      </footer>
    </div>
  );
}