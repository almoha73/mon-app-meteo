import React from "react";
import styles from "@/styles/Home.module.css";

interface WeekendForecastCardProps {
  forecasts: string[];
}

const WeekendForecastCard: React.FC<WeekendForecastCardProps> = ({ forecasts }) => {
  if (!forecasts || forecasts.length === 0) return null;

  return (
    <section className={styles.card}>
      <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>
        Prévisions week-end prochain
      </h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {forecasts.map((msg, idx) => (
          <li
            key={idx}
            style={{
              marginBottom: "0.7em",
              fontWeight: 500,
              color: msg.includes("Pluie") ? "#007bff" : msg.includes("couvert") ? "#888" : "#28a745",
              textAlign: "center",
              fontSize: "1.1em",
            }}
          >
            {msg}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WeekendForecastCard;