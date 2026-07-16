const fs = require('fs');
let code = fs.readFileSync('src/components/PartnerPortal.tsx', 'utf8');

const oldAnalyticsData = `  const analyticsData = useMemo(() => {
    const completed = orders.filter(o => o.status === 'Completed');
    const cancelled = orders.filter(o => o.status === 'Cancelled' || o.status === 'Refunded');
    
    const totalRev = completed.reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
    const avgOrderValue = completed.length > 0 ? (totalRev / completed.length) : 0;
    const cancelRate = orders.length > 0 ? (cancelled.length / orders.length) * 100 : 0;

    // Revenue per day chart data
    const dailyRev: { [date: string]: number } = {};
    completed.forEach(o => {
      const date = o.createdAt ? new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'N/A';
      dailyRev[date] = (dailyRev[date] || 0) + (o.totalAmount || o.totalPrice || 0);
    });

    const revChart = Object.keys(dailyRev).map(date => ({
      date,
      Revenue: Math.round(dailyRev[date] * 100) / 100
    })).reverse().slice(-10); // Last 10 days

    // Top Selling Products counts
    const prodCounts: { [name: string]: number } = {};
    completed.forEach(o => {
      (o.items || []).forEach((item: any) => {
        prodCounts[item.name] = (prodCounts[item.name] || 0) + (item.quantity || 1);
      });
    });

    const topProductsChart = Object.keys(prodCounts).map(name => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      Sales: prodCounts[name]
    })).sort((a, b) => b.Sales - a.Sales).slice(0, 5);

    return { totalRev, avgOrderValue, cancelRate, revChart, topProductsChart };
  }, [orders]);`;

const newAnalyticsData = `  const analyticsData = useMemo(() => {
    const completed = orders.filter(o => o.status === 'Completed');
    const cancelled = orders.filter(o => o.status === 'Cancelled');
    const refunded = orders.filter(o => o.status === 'Refunded');
    
    const totalRev = completed.reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
    const avgOrderValue = completed.length > 0 ? (totalRev / completed.length) : 0;
    const cancelRate = orders.length > 0 ? (cancelled.length / orders.length) * 100 : 0;
    const refundRate = orders.length > 0 ? (refunded.length / orders.length) * 100 : 0;

    // Customer calculation
    const customersMap: Record<string, number> = {};
    completed.forEach(o => {
      if (o.userId) {
        customersMap[o.userId] = (customersMap[o.userId] || 0) + 1;
      }
    });
    const uniqueCustomers = Object.keys(customersMap).length;
    const repeatCustomers = Object.values(customersMap).filter(v => v > 1).length;

    // Revenue per day chart data
    const dailyRev: { [date: string]: number } = {};
    completed.forEach(o => {
      const date = o.createdAt ? new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'N/A';
      dailyRev[date] = (dailyRev[date] || 0) + (o.totalAmount || o.totalPrice || 0);
    });

    const revChart = Object.keys(dailyRev).map(date => ({
      date,
      Revenue: Math.round(dailyRev[date] * 100) / 100
    })).slice(-10);

    // Hourly distribution (Peak Hours)
    const hourlyCounts = Array(24).fill(0);
    completed.forEach(o => {
      if(o.createdAt) {
        const d = new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt);
        if(!isNaN(d.getTime())) {
          hourlyCounts[d.getHours()]++;
        }
      }
    });
    const peakHoursChart = hourlyCounts.map((count, hour) => ({
      hour: hour + ":00",
      Orders: count
    }));

    // Top Selling Products counts
    const prodCounts: { [name: string]: number } = {};
    completed.forEach(o => {
      (o.items || []).forEach((item: any) => {
        prodCounts[item.name] = (prodCounts[item.name] || 0) + (item.quantity || 1);
      });
    });

    const topProductsChart = Object.keys(prodCounts).map(name => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      Sales: prodCounts[name]
    })).sort((a, b) => b.Sales - a.Sales).slice(0, 5);

    return { 
      totalRev, avgOrderValue, cancelRate, refundRate, uniqueCustomers, repeatCustomers,
      revChart, topProductsChart, peakHoursChart 
    };
  }, [orders]);`;

// Need to safely replace this.
const startIndex = code.indexOf("const analyticsData = useMemo(() => {");
const endIndex = code.indexOf("}, [orders]);", startIndex) + 13;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newAnalyticsData + code.substring(endIndex);
  fs.writeFileSync('src/components/PartnerPortal.tsx', code);
} else {
  console.log("Could not find analyticsData block");
}
