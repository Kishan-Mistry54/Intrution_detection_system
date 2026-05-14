import { Shield, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";

// 1. DEFINE TYPES
type HistoryEntry = {
  date: string;
  time: string;
  attacks: number;
  normal: number;
  total: number;
};

type ChartDataEntry = {
  name: string;
  normal: number;
  attack: number;
};

// Helper to format big numbers
const formatNumber = (num: number) => {
  return num.toLocaleString();
};

const Dashboard = () => {
  const [totalPackets, setTotalPackets] = useState(0);
  const [normalCount, setNormalCount] = useState(0);
  const [attackCount, setAttackCount] = useState(0);
  const [chartData, setChartData] = useState<ChartDataEntry[]>([]);

  // 4. LIVE POLLING: Fetch live data every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/live_predict');
        const data = await response.json();

        if (data.status === 'success' && data.predictions.length > 0) {
          console.log("Live update received:", data.predictions.length, "packets");
          
          // Calculate stats from live batch
          const attacks = data.predictions.filter((p: string) => p !== 'normal').length;
          const normal = data.predictions.filter((p: string) => p === 'normal').length;

          // Create a new entry for the chart
          const newEntry = {
            date: new Date().toLocaleTimeString(),
            time: new Date().toLocaleTimeString(),
            attacks: attacks,
            normal: normal,
            total: data.predictions.length,
          };

          // Update LocalStorage
          const history = JSON.parse(localStorage.getItem('scan_history') || '[]');
          history.push(newEntry);
          if (history.length > 20) history.shift(); // Keep chart clean
          localStorage.setItem('scan_history', JSON.stringify(history));

          // Force Update Stats
          updateDashboardStats();
        }
      } catch (error) {
        console.log("Waiting for live data...");
      }
    }, 5000); // Run every 5 seconds

    return () => clearInterval(interval);
  }, []);


  // New Function: Check if Server Restarted
  const checkSessionAndLoadStats = async () => {
    try {
      // 1. Ask Python for its Session ID
      const response = await fetch('http://127.0.0.1:5000/get_session_id');
      const data = await response.json();
      const serverId = data.session_id;

      // 2. Check what ID we have stored in the browser
      const storedId = localStorage.getItem('app_session_id');

      // 3. Compare
      if (serverId !== storedId) {
        // IDs don't match -> SERVER RESTARTED -> Clear History!
        console.log("New Session Detected: Clearing Dashboard History.");
        localStorage.removeItem('scan_history');
        localStorage.setItem('app_session_id', serverId); // Save the new ID
      }

      // 4. Load stats (either fresh or old)
      updateDashboardStats();

    } catch (error) {
      console.log("Backend not reachable, loading cached data.");
      updateDashboardStats();
    }
  };

  // Function to calculate stats from LocalStorage
  const updateDashboardStats = () => {
    const history = JSON.parse(localStorage.getItem('scan_history') || '[]') as HistoryEntry[];
    
    let total = 0;
    let attacks = 0;
    let normals = 0;

    history.forEach((entry: HistoryEntry) => {
      total += entry.total || 0;
      attacks += entry.attacks || 0;
      normals += entry.normal || 0;
    });

    setTotalPackets(total);
    setAttackCount(attacks);
    setNormalCount(normals);

    const formattedHistory = history.slice(-7).map((entry: HistoryEntry, index: number) => ({
      name: `Scan ${index + 1}`, 
      normal: entry.normal,
      attack: entry.attacks,
    }));

    setChartData(formattedHistory);
  };

  const stats = [
    {
      title: "Total Packets Analyzed",
      value: formatNumber(totalPackets),
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Normal Traffic",
      value: formatNumber(normalCount),
      icon: CheckCircle,
      color: "text-neon-green",
      bgColor: "bg-neon-green/10",
    },
    {
      title: "Detected Threats",
      value: formatNumber(attackCount),
      icon: AlertTriangle,
      color: "text-neon-red",
      bgColor: "bg-neon-red/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative rounded-xl border border-border bg-card p-8 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 glow-cyan">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient-cyber">
                Intrusion Detection System
              </h1>
              <p className="text-muted-foreground mt-1">
                Machine Learning based Network Traffic Analysis & Threat Detection
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Real-time network monitoring powered by advanced ML algorithms. Classifies incoming 
            network packets as <span className="text-neon-green font-semibold">Normal</span> or 
            <span className="text-neon-red font-semibold"> Attack</span> traffic with high accuracy, 
            providing instant alerts and comprehensive analytics.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold font-mono ${stat.color}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Traffic Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Scan History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(215 15% 55%)"
                  fontSize={12}
                  fontFamily="JetBrains Mono"
                />
                <YAxis
                  stroke="hsl(215 15% 55%)"
                  fontSize={12}
                  fontFamily="JetBrains Mono"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220 18% 10%)",
                    border: "1px solid hsl(220 15% 18%)",
                    borderRadius: "8px",
                    color: "hsl(210 20% 90%)",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="normal" name="Normal" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`norm-${index}`} fill="hsl(145 70% 50%)" fillOpacity={0.8} />
                  ))}
                </Bar>
                <Bar dataKey="attack" name="Attack" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`atk-${index}`} fill="hsl(0 72% 55%)" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
              No data yet. Go to the "Analyzer" page and upload a CSV to see stats.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;