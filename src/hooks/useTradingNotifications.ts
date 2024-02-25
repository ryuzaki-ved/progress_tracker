import { useState, useEffect, useCallback } from 'react';
import { TradingNotificationData } from '../components/ui/TradingNotification';

export const useTradingNotifications = () => {
  const [notifications, setNotifications] = useState<TradingNotificationData[]>([]);

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => {
        const now = new Date();
        return prev.filter(notification => {
          const timeDiff = now.getTime() - notification.timestamp.getTime();
          return timeDiff < 5000; // Keep notifications for 5 seconds
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addNotification = useCallback((notification: Omit<TradingNotificationData, 'id' | 'timestamp'>) => {
    const newNotification: TradingNotificationData = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper functions for different notification types
  const notifyStockBuy = useCallback((stockName: string, quantity: number, price: number, totalCost: number) => {
    addNotification({
      type: 'buy_stock',
      title: 'Stock Purchased! 📈',
      message: `Successfully bought ${quantity} shares of ${stockName}`,
      amount: totalCost,
      stockName
    });
  }, [addNotification]);

  const notifyStockSell = useCallback((stockName: string, quantity: number, price: number, totalProceeds: number) => {
    addNotification({
      type: 'sell_stock',
      title: 'Stock Sold! 📉',
      message: `Successfully sold ${quantity} shares of ${stockName}`,
      amount: totalProceeds,
      stockName
    });
  }, [addNotification]);

  const notifyStockPnL = useCallback((stockName: string, pnl: number, isProfit: boolean) => {
    addNotification({
      type: isProfit ? 'stock_pnl_profit' : 'stock_pnl_loss',
      title: isProfit ? 'Profit Booked! 💰' : 'Loss Booked! 📉',
      message: `${stockName} ${isProfit ? 'profit' : 'loss'} realized`,
      amount: Math.abs(pnl),
      stockName
    });
  }, [addNotification]);

  const notifyOptionBuy = useCallback((optionDetails: string, quantity: number, premium: number, totalCost: number) => {
    addNotification({
      type: 'buy_option',
      title: 'Option Purchased! 🎯',
      message: `Bought ${quantity} ${optionDetails} contracts`,
      amount: totalCost,
      optionDetails
    });
  }, [addNotification]);

  const notifyOptionWrite = useCallback((optionDetails: string, quantity: number, premium: number, totalProceeds: number) => {
    addNotification({
      type: 'write_option',
      title: 'Option Written! ⚡',
      message: `Wrote ${quantity} ${optionDetails} contracts`,
      amount: totalProceeds,
      optionDetails
    });
  }, [addNotification]);

  const notifyOptionExit = useCallback((optionDetails: string, quantity: number, premium: number, totalProceeds: number) => {
    addNotification({
      type: 'exit_option',
      title: 'Option Exited! 🔄',
      message: `Exited ${quantity} ${optionDetails} contracts`,
      amount: totalProceeds,
      optionDetails
    });
  }, [addNotification]);

  const notifyOptionPnL = useCallback((optionDetails: string, pnl: number, isProfit: boolean) => {
    addNotification({
      type: isProfit ? 'option_pnl_profit' : 'option_pnl_loss',
      title: isProfit ? 'Option Profit! 💎' : 'Option Loss! 💸',
      message: `${optionDetails} ${isProfit ? 'profit' : 'loss'} realized`,
      amount: Math.abs(pnl),
      optionDetails
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    notifyStockBuy,
    notifyStockSell,
    notifyStockPnL,
    notifyOptionBuy,
    notifyOptionWrite,
    notifyOptionExit,
    notifyOptionPnL
  };
}; 