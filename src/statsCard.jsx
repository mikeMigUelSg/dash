// components/StatsCard.jsx
import React from "react";

export function StatsCard({ title, value, unit }) {
  return (
    <div className="d-flex flex-column align-items-start justify-content-center bg-white rounded shadow p-3 h-100 w-100">
      <span className="text-secondary small">{title}</span>
      <span className="fw-bold fs-4">
        {value} {unit}
      </span>
    </div>
  );
}
