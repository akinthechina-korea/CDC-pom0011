import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationBellProps {
  userRole?: 'driver' | 'field' | 'office';
}

export function NotificationBell({ userRole }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications(userRole);

  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'report_submitted':
        return `새 보고서가 제출되었습니다: ${notification.containerNo}`;
      case 'report_approved':
        return `보고서가 승인되었습니다: ${notification.containerNo}`;
      case 'report_rejected':
        return `보고서가 반려되었습니다: ${notification.containerNo}`;
      case 'report_completed':
        return `보고서가 완료되었습니다: ${notification.containerNo}`;
      default:
        return `알림: ${notification.containerNo}`;
    }
  };

  const getNotificationColor = (notification: Notification): string => {
    switch (notification.type) {
      case 'report_submitted':
        return 'bg-chart-3/10 hover:bg-chart-3/20';
      case 'report_approved':
        return 'bg-chart-4/10 hover:bg-chart-4/20';
      case 'report_rejected':
        return 'bg-destructive/10 hover:bg-destructive/20';
      case 'report_completed':
        return 'bg-chart-1/10 hover:bg-chart-1/20';
      default:
        return 'bg-muted hover:bg-muted/80';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-notification-count"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="font-semibold text-sm">알림</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-7 text-xs"
              data-testid="button-mark-all-read"
            >
              모두 읽음
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              알림이 없습니다
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  notification.read ? 'opacity-60' : ''
                } ${getNotificationColor(notification)}`}
                onClick={() => markAsRead(notification.id)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <span className="text-sm font-medium flex-1">
                    {getNotificationMessage(notification)}
                  </span>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-chart-1 flex-shrink-0 mt-1" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(notification.timestamp, {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
                className="w-full h-7 text-xs"
                data-testid="button-clear-all"
              >
                모두 지우기
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
