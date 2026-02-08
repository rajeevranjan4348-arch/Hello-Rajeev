import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader } from "@/components/ui/sidebar"
import { Briefcase, MessageSquare, Phone, Users, Settings, Plus } from "lucide-react"
import { Link, useLocation } from "wouter"

export function AppSidebar() {
  const [location] = useLocation();

  const menuItems = [
    { title: "Chats", url: "/", icon: MessageSquare },
    { title: "Calls", url: "/calls", icon: Phone },
    { title: "People", url: "/people", icon: Users },
    { title: "Settings", url: "/settings", icon: Settings },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl">SwiftChat</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
