"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  LogOut,
  Wallet,
} from "lucide-react";
import { classNames } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { href: "/goals", label: "Metas", icon: Target },
];

export default function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Wallet size={20} />
          </div>
          <span className="text-lg font-bold text-gray-900">Finanzas</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={classNames(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gray-100 pt-3">
          <p className="truncate px-3 pb-2 text-xs text-gray-400" title={email}>
            {email}
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn-ghost w-full justify-start">
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Barra inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white md:hidden">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
                active ? "text-brand-700" : "text-gray-500"
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
