import React from "react";
import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * RadarChart Component
 * Visualizes toxicity scores across multiple endpoints
 * Interactive Recharts radar chart with responsive design
 */
interface RadarChartProps {
  data: Array<{
    endpoint: string;
    value: number;
  }>;
  title?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  title = "Toxicity Profile",
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No data available for radar chart</p>
      </div>
    );
  }

  // Normalize data for radar chart (0-100 scale)
  const normalizedData = data.map((item) => ({
    ...item,
    value: Math.min(100, Math.max(0, item.value * 100)),
  }));

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsRadar
          cx="50%"
          cy="50%"
          outerRadius={120}
          data={normalizedData}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="endpoint" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Toxicity"
            dataKey="value"
            stroke="#0284c7"
            fill="#0ea5e9"
            fillOpacity={0.6}
            animationDuration={800}
          />
          <Tooltip
            formatter={(value) => `${(value as number).toFixed(2)}%`}
            contentStyle={{
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};
