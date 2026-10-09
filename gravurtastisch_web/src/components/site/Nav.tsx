import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Container } from "./Container";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { SUPPORTED_LANGUAGES } from "@/i18n/config";
import {
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
  CalendarClock,
  BarChart3,
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Nav() {
  const { t, i18n } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const darkHeroPages = [
    "/",
    "/amazon-sp-api",
    "/order-sync",
    "/smart-scheduling",
    "/guide",
    // "/review-analytics",
    "/blogs",
  ];
  const hasDarkHero =
    darkHeroPages.includes(pathname) ||
    pathname.startsWith("/blogs") ||
    pathname.startsWith("/guide");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(true);

  const [activeSection, setActiveSection] = useState<string>("home");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);

      if (pathname === "/") {
        const sectionIds = ["contact", "pricing", "how", "home"];
        const scrollPosition = window.scrollY + 140;

        for (const sectionId of sectionIds) {
          const el = document.getElementById(sectionId);
          if (el) {
            const top = el.offsetTop;
            const height = el.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setActiveSection(sectionId);
              return;
            }
          }
        }
        if (window.scrollY < 200) {
          setActiveSection("home");
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const solid = scrolled || !hasDarkHero || mobileMenuOpen;
  const logoURl = !solid ? "/logo-white.svg?v=gt2" : "/logo.svg?v=gt2";

  const serviceItems = [
    {
      href: "/amazon-sp-api",
      label: t("footer.colPlatformLink1") || "Studio Integrations",
      icon: ShieldCheck,
      description: "Secure shop connections & artwork intake",
    },
    {
      href: "/order-sync",
      label: t("footer.colPlatformLink2") || "Order Desk",
      icon: RefreshCw,
      description: "Live custom-order tracking from proof to ship",
    },
    {
      href: "/smart-scheduling",
      label: t("footer.colPlatformLink3") || "Production Timing",
      icon: CalendarClock,
      description: "Craft slots timed around proofs & capacity",
    },
  ];

  const isServiceActive = serviceItems.some((s) => pathname === s.href);

  const mainLinks: Array<
    | { type: "services"; href?: undefined; hash?: undefined; label?: undefined }
    | { type?: undefined; href: string; hash?: string; label: string }
  > = [
    { href: "/#home", hash: "home", label: t("nav.home") },
    { href: "/#pricing", hash: "pricing", label: t("nav.pricing") },
    { type: "services" },
    { href: "/#how", hash: "how", label: t("nav.howItWorks") },
    { href: "/#contact", hash: "contact", label: t("nav.contact") },
    { href: "/guide", label: t("nav.guide") || "Guide" },
    { href: "/blogs", label: t("nav.blogs") || "Blogs" },
  ];

  const checkIsActive = (item: (typeof mainLinks)[number]) => {
    if (item.type === "services") {
      return isServiceActive;
    }
    if (item.href === "/blogs") {
      return pathname === "/blogs" || pathname.startsWith("/blogs");
    }
    if (item.href === "/guide") {
      return pathname === "/guide" || pathname.startsWith("/guide");
    }
    if (pathname === "/") {
      if (item.hash === "home") return activeSection === "home";
      if (item.hash === "pricing") return activeSection === "pricing";
      if (item.hash === "how") return activeSection === "how";
      if (item.hash === "contact") return activeSection === "contact";
    }
    return pathname === item.href;
  };

  const getLinkClasses = (isActive: boolean) =>
    `transition-colors whitespace-nowrap px-2.5 py-1.5 rounded-lg select-none text-xs xl:text-sm font-medium cursor-pointer ${
      isActive
        ? solid
          ? "text-brand font-bold"
          : "text-white font-bold underline underline-offset-4 decoration-brand"
        : solid
          ? "hover:text-navy-deep text-slate-body"
          : "hover:text-white text-white/80"
    }`;

  const getTriggerClasses = (isActive: boolean) =>
    `group inline-flex items-center gap-1 transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg select-none outline-none focus:outline-none focus-visible:outline-none border-none ring-0 bg-transparent hover:bg-transparent shadow-none text-xs xl:text-sm font-medium ${
      isActive
        ? solid
          ? "!text-brand font-bold"
          : "!text-white font-bold underline underline-offset-4 decoration-brand"
        : solid
          ? "text-slate-body hover:!text-navy-deep data-[state=open]:!text-navy-deep"
          : "text-white/80 hover:!text-white data-[state=open]:!text-white"
    }`;

  const currentLang =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        solid
          ? "backdrop-blur-lg bg-background/90 border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <Container className="h-16 lg:h-17 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 md:gap-2.5 group">
          <img
            src={logoURl}
            className="h-8 w-8 transition-transform duration-300 group-hover:scale-105"
            alt={t("nav.logoAlt")}
          />
          <span
            className={`font-extrabold tracking-tight text-lg md:text-xl xl:text-2xl transition-colors ${
              solid ? "text-navy-deep" : "text-white"
            }`}
          >
            Gravur
            <span className={solid ? "text-brand" : "text-brand-bright"}>
              tastisch
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu
          className={`hidden lg:flex max-w-none transition-colors ${
            solid ? "text-slate-body" : "text-white/80"
          }`}
        >
          <NavigationMenuList className="flex items-center gap-1.5 xl:gap-2.5 2xl:gap-3.5 list-none m-0 p-0">
            {mainLinks.map((item, idx) => {
              const isActive = checkIsActive(item);

              if (item.type === "services") {
                return (
                  <NavigationMenuItem key="services-menu" className="relative">
                    <NavigationMenuTrigger className={getTriggerClasses(isActive)}>
                      <span>{t("nav.services") || "Services"}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="p-3 w-[460px] md:w-[500px] lg:w-[540px]">
                      <div className="grid grid-cols-2 gap-2">
                        {serviceItems.map((service) => {
                          const isSubActive = pathname === service.href;
                          const Icon = service.icon;
                          return (
                            <NavigationMenuLink asChild key={service.href}>
                              <Link
                                to={service.href}
                                className={`group/item flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200 outline-none ${
                                  isSubActive
                                    ? "bg-brand/10 text-brand ring-1 ring-brand/20 shadow-xs"
                                    : "hover:bg-slate-100/90 dark:hover:bg-white/[0.08] text-slate-body hover:text-navy-deep"
                                }`}
                              >
                                <div
                                  className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 transition-all duration-200 shadow-xs ${
                                    isSubActive
                                      ? "bg-brand text-white shadow-brand/30"
                                      : "bg-brand/10 text-brand group-hover/item:bg-brand group-hover/item:text-white group-hover/item:scale-105"
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span
                                    className={`text-xs font-bold leading-snug transition-colors ${
                                      isSubActive
                                        ? "text-brand"
                                        : "text-navy-deep group-hover/item:text-brand"
                                    }`}
                                  >
                                    {service.label}
                                  </span>
                                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                                    {service.description}
                                  </p>
                                </div>
                              </Link>
                            </NavigationMenuLink>
                          );
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              }

              const linkClass = getLinkClasses(isActive);

              if (item.hash) {
                return (
                  <NavigationMenuItem key={item.href || idx}>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/"
                        hash={item.hash}
                        className={linkClass}
                        onClick={(e) => {
                          if (pathname === "/") {
                            e.preventDefault();
                            const el = document.getElementById(item.hash!);
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth" });
                              window.history.pushState(null, "", `/#${item.hash}`);
                              setActiveSection(item.hash!);
                            }
                          }
                        }}
                      >
                        {item.label}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              }

              return (
                <NavigationMenuItem key={item.href || idx}>
                  <NavigationMenuLink asChild>
                    <Link to={item.href!} className={linkClass}>
                      {item.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right CTA Actions & Mobile Toggle */}
        <div className="flex items-center gap-2 md:gap-3">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem className="relative">
                <NavigationMenuTrigger
                  aria-label={t("nav.languageSwitcherLabel")}
                  className={`h-9 md:h-10 w-auto min-w-[50px] md:min-w-[130px] text-xs md:text-sm font-medium rounded-full border px-3 md:px-4 bg-transparent cursor-pointer transition-all inline-flex items-center justify-between gap-1.5 shadow-none
                    ${
                      solid
                        ? "text-slate-body border-border hover:border-navy-deep hover:bg-slate-100/50 data-[state=open]:border-navy-deep"
                        : "text-white/80 border-white/20 hover:border-white/50 hover:bg-white/10 data-[state=open]:border-white/50"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <FlagIcon code={currentLang?.code || "en"} className="w-4 h-2.5 rounded-[2px]" />
                    <span className="hidden md:inline">{currentLang?.label}</span>
                    <span className="md:hidden">{currentLang?.tag}</span>
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="p-1.5 w-[160px] md:w-[175px]">
                  <div className="flex flex-col gap-0.5">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = i18n.language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => i18n.changeLanguage(lang.code)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left outline-none ${
                            isSelected
                              ? "bg-brand/10 text-brand font-bold"
                              : "text-slate-body hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-navy-deep"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <FlagIcon code={lang.code} className="w-4 h-2.5 rounded-[2px]" />
                            <span>{lang.label}</span>
                          </span>
                          {isSelected && (
                            <span className="text-brand font-bold text-xs">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <a
            href="/#register"
            className="h-9 md:h-10 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand px-4 md:px-5 text-xs md:text-sm font-semibold text-white shadow-[0_8px_24px_-8px_oklch(0.55_0.22_265/0.6)] hover:bg-brand-bright hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
          >
            <span className="hidden sm:inline">{t("nav.registerAsSeller")}</span>
            <span className="sm:hidden">{t("nav.registerShort") || "Register"}</span>
            <span aria-hidden>→</span>
          </a>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg border transition-colors ${
              solid
                ? "border-border text-navy-deep hover:bg-slate-100"
                : "border-white/20 text-white hover:bg-white/10"
            }`}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl px-6 py-4 shadow-xl">
          <nav className="flex flex-col gap-2">
            {mainLinks.map((item, idx) => {
              if (item.type === "services") {
                return (
                  <div key="mobile-services" className="py-1">
                    <button
                      type="button"
                      onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                      className={`flex items-center justify-between w-full py-2 text-sm font-medium transition-colors ${
                        isServiceActive
                          ? "text-brand font-bold"
                          : "text-slate-body hover:text-navy-deep"
                      }`}
                    >
                      <span>{t("nav.services") || "Services"}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          mobileServicesOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {mobileServicesOpen && (
                      <div className="pl-3 pr-1 py-1 flex flex-col gap-1 border-l-2 border-brand/30 ml-2 mt-1 mb-1">
                        {serviceItems.map((s) => {
                          const isActive = pathname === s.href;
                          const Icon = s.icon;
                          return (
                            <Link
                              key={s.href}
                              to={s.href}
                              className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                                isActive
                                  ? "bg-brand/10 text-brand font-bold"
                                  : "text-slate-body hover:bg-slate-100 hover:text-navy-deep"
                              }`}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 ${
                                  isActive ? "text-brand" : "text-slate-400"
                                }`}
                              />
                              <span>{s.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = checkIsActive(item);
              const linkClasses = `py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-brand font-bold"
                  : "text-slate-body hover:text-navy-deep"
              }`;

              if (item.hash) {
                return (
                  <Link
                    key={item.href || idx}
                    to="/"
                    hash={item.hash}
                    className={linkClasses}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (pathname === "/") {
                        e.preventDefault();
                        const el = document.getElementById(item.hash!);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                          window.history.pushState(null, "", `/#${item.hash}`);
                          setActiveSection(item.hash!);
                        }
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href || idx}
                  to={item.href!}
                  className={linkClasses}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

