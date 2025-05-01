// components/StatsContainer.jsx
import React from "react";
import { StatsCard } from "./statsCard";

export function StatsContainer() {
  const statsData = [
    { title: "Average", value: 23.5, unit: "°C" },
    { title: "Median", value: 23.2, unit: "C" },
    { title: "Std Dev", value: 0, unit: "" },
  ];

  return (
    <div className=" w-100 d-flex bg-white border rounded p-0 justify-content-start align-items-center mt-0 ps-4 gap-4">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className="flex-fill"
          style={{ minWidth: "200px", maxWidth: "250px" }}
        >
          
          <StatsCard
            title={stat.title}
            value={stat.value}
            unit={stat.unit}
          />
        </div>
      ))}
    </div>
  );
}
