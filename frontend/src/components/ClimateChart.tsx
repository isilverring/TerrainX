import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Observation } from "../lib/models";
export default function ClimateChart({
  observation,
}: {
  observation: Observation;
}) {
  const data = observation.monthly.map((value, i) => ({
    month: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ][i],
    temperature: value,
  }));
  return (
    <figure className="climate-chart">
      <figcaption>
        Monthly mean Earth air temperature · {observation.unit}
      </figcaption>
      <div className="chart-canvas">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 16, right: 20, bottom: 8, left: 0 }}
          >
            <CartesianGrid stroke="#29384E" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#97A8BD", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#97A8BD", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#111A29",
                border: "1px solid #29384E",
                color: "#F2F5FA",
              }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#35C3B0"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details>
        <summary>View accessible monthly temperature table</summary>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Air temperature ({observation.unit})</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.month}>
                <td>{d.month}</td>
                <td>{d.temperature ?? "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
