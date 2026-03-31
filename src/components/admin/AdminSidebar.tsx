// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, Users, Shield, TrendingUp, DollarSign, MessageSquare,
  Calendar, ClipboardList, Gift, Star, Megaphone, Zap, Store, Settings, Flag, Book
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

interface AdminSidebarProps {
  pendingReports?: number;
  activePage?: string;
}

export default function AdminSidebar({ pendingReports = 0 }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ full_name?: string; email?: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          email: authUser.email,
        });
      }
    });
  }, []);

  const navItems: NavItem[] = [
    { label: 'Overview', icon: BarChart3, path: '/admindashboard' },
    { label: 'Users', icon: Users, path: '/adminusers' },
    { label: 'Moderation', icon: Shield, path: '/adminmoderation', badge: pendingReports },
    { label: 'Analytics', icon: TrendingUp, path: '/adminanalytics' },
    { label: 'Audit Logs', icon: ClipboardList, path: '/adminauditlogs' },
    { label: 'Subscriptions', icon: DollarSign, path: '/adminsubscriptions' },
    { label: 'Events', icon: Calendar, path: '/adminevents' },
    { label: 'VIP Events', icon: Gift, path: '/adminvipevents' },
    { label: 'Ambassadors', icon: Star, path: '/adminambassadors' },
    { label: 'Broadcast', icon: Megaphone, path: '/adminbroadcast' },
    { label: 'Content', icon: MessageSquare, path: '/admincontent' },
    { label: 'Feature Flags', icon: Zap, path: '/adminfeatureflags' },
    { label: 'Marketplace', icon: Store, path: '/adminmarketplace' },
    { label: 'Settings', icon: Settings, path: '/adminsettings' },
  ];

  const utilityItems: NavItem[] = [
    { label: 'Launch Checklist', icon: Flag, path: '/adminlaunchchecklist' },
    { label: 'Admin Manual', icon: Book, path: '/adminmanual' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col h-screen sticky top-0`}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-white">Afrinnect</h1>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-orange-500/20 text-orange-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-sm">{item.label}</span>
                    {(item.badge ?? 0) > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">{item.badge}</Badge>
                    )}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Utility Links */}
        {!collapsed && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <p className="px-3 text-xs font-medium text-slate-500 uppercase mb-2">Resources</p>
          </div>
        )}
        <ul className="space-y-1 mt-1">
          {utilityItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.path) 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-medium flex-shrink-0">
                {user?.full_name?.[0] || 'A'}
              </div>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user?.full_name || 'Admin'}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
            <DropdownMenuItem 
              onClick={() => navigate('/home')} 
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Eye className="w-4 h-4 mr-2" /> View App
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem 
              onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} 
              className="text-red-400 hover:text-red-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
