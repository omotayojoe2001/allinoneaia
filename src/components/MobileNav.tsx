import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Zap,
  Palette,
  Briefcase,
  Bell,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const mobileNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Sparkles, label: 'AI', path: '/ai-agent' },
  { icon: Briefcase, label: 'Business', path: '/business' },
  { icon: Palette, label: 'Marketing', path: '/content' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border lg:hidden"
    >
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-sidebar-foreground hover:text-primary'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="mobile-active"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default MobileNav;
