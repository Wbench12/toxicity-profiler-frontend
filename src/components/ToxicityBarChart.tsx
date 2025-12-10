import React from "react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * ToxicityBarChart Component
 * Displays toxicity predictions for each endpoint as a bar chart
 * Uses color coding: green (low), yellow (medium), red (high)
 */
interface ToxicityBarChartProps {
  data: Array<{
    endpoint: string;
    prediction: number;
  }>;
  title?: string;
}

export const ToxicityBarChart: React.FC<ToxicityBarChartProps> = ({
  data,
  title = "Toxicity by Endpoint",
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No data available for bar chart</p>
      </div>
    );
  }

  const getBarColor = (value: number) => {
    if (value > 0.7) return "#ef4444"; // red
    if (value > 0.4) return "#f59e0b"; // yellow
    return "#10b981"; // green
  };

  const chartData = data.map((item) => ({
    ...item,
    displayValue: Math.min(100, Math.max(0, item.prediction * 100)),
  }));

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBar
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="endpoint" />
          <YAxis domain={[0, 100]} />
          <Tooltip
            formatter={(value) => `${(value as number).toFixed(2)}%`}
            contentStyle={{
              backgroundColor: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
          <Bar
            dataKey="displayValue"
            name="Toxicity Score"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.prediction)}
              />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
};
