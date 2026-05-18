"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Lun", pkd: 4000 },
  { day: "Mar", pkd: 3000 },
  { day: "Mié", pkd: 2000 },
  { day: "Jue", pkd: 2780 },
  { day: "Vie", pkd: 1890 },
  { day: "Sáb", pkd: 2390 },
  { day: "Dom", pkd: 3490 },
];

export default function StatsChart() {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 0,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorPkd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94A3B8", fontSize: 12 }} 
            dy={10}
          />
          <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
          <Tooltip 
            contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
            itemStyle={{ color: "#06B6D4", fontWeight: "bold" }}
          />
          <Area
            type="monotone"
            dataKey="pkd"
            stroke="#06B6D4"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPkd)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
