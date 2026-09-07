"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState } from "react"
import {
  ChevronsLeft,
  FileText,
  FolderKanban,
  Home,
  Moon,
  MoreHorizontal,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigationItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/users", label: "Users", icon: Users },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/todos", label: "Todos", icon: FolderKanban },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div
      className={`flex min-h-screen flex-col gap-4 border-r p-3 transition-[width] ${
        isCollapsed ? "w-16" : "w-52"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {!isCollapsed && <span className="px-2 text-sm font-semibold">Navigation</span>}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={isCollapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
        >
          <ChevronsLeft className={isCollapsed ? "rotate-180" : undefined} />
        </Button>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Navigation principale">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === href : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              aria-label={isCollapsed ? label : undefined}
              title={isCollapsed ? label : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${isCollapsed ? "justify-center px-2" : ""}`}
            >
              <Icon className="size-4 shrink-0" />
              {!isCollapsed && label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        <div
          className={`mb-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground ${
            isCollapsed ? "justify-center px-2" : "justify-between"
          }`}
        >
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Activer le mode nuit"
            >
              <Moon />
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Moon className="size-4 shrink-0" />
                <span>Mode nuit</span>
              </div>
              <Switch
                checked={resolvedTheme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Activer le mode nuit"
              />
            </>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size={isCollapsed ? "icon-sm" : "default"}
              className={isCollapsed ? "w-full" : "w-full justify-start"}
              aria-label="Ouvrir le menu"
            >
              <MoreHorizontal />
              {!isCollapsed && "Plus d'options"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link href="/">
                <Settings />
                Tableau de bord
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/posts">
                <FileText />
                Documentation
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}