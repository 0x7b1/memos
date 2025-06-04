import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { HomeSidebar, HomeSidebarDrawer } from "@/components/HomeSidebar";
import MobileHeader from "@/components/MobileHeader";
import useResponsiveWidth from "@/hooks/useResponsiveWidth";
import { cn } from "@/utils";

const HomeLayout = observer(() => {
  const { md, lg } = useResponsiveWidth();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasInteractedWithSidebar, setHasInteractedWithSidebar] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (md) {
      if (!hasInteractedWithSidebar) {
        setIsSidebarOpen(windowWidth >= 880);
      }
    } else {
      setHasInteractedWithSidebar(false);
    }
  }, [md, windowWidth, hasInteractedWithSidebar]);

  const toggleDesktopSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setHasInteractedWithSidebar(true);
  };

  return (
    <section className="@container w-full min-h-full flex flex-col justify-start items-center">
      {!md && (
        <MobileHeader>
          <HomeSidebarDrawer />
        </MobileHeader>
      )}
      {md && (
        <>
          <div
            className={cn(
              "fixed top-0 left-16 shrink-0 h-[100svh] transition-all duration-300 ease-in-out",
              isSidebarOpen ? (lg ? "w-72" : "w-56") : "w-0",
              isSidebarOpen ? "border-r border-gray-200 dark:border-zinc-800" : "border-r-0",
            )}
          >
            {isSidebarOpen && <HomeSidebar className={cn("px-3 py-6 h-full overflow-y-auto")} />}
          </div>
          <button
            onClick={toggleDesktopSidebar}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className={cn(
              "fixed bottom-4 z-20 p-1 rounded-full",
              "bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 shadow-lg",
              "hover:bg-gray-50 dark:hover:bg-zinc-700",
              "transition-all duration-300 ease-in-out",
              "transform -translate-x-1/2",
              isSidebarOpen ? (lg ? "left-[calc(4rem+18rem)]" : "left-[calc(4rem+14rem)]") : "left-[4rem]",
            )}
          >
            {isSidebarOpen ? (
              <ChevronLeftIcon className="size-4 text-gray-500 dark:text-gray-300" />
            ) : (
              <ChevronRightIcon className="size-4 text-gray-500 dark:text-gray-300" />
            )}
          </button>
        </>
      )}
      <div
        className={cn(
          "w-full min-h-full transition-all duration-300 ease-in-out",
          md && (isSidebarOpen ? (lg ? "pl-72" : "pl-56") : "pl-0"),
        )}
      >
        <div className={cn("w-full mx-auto px-4 sm:px-6 md:pt-6 pb-8")}>
          <Outlet />
        </div>
      </div>
    </section>
  );
});

export default HomeLayout;
