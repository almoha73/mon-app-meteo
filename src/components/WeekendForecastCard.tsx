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
            className={styles.weekendForecastItem}
            style={{
              marginBottom: "0.8em",
              fontWeight: 600,
              textAlign: "center",
              fontSize: "1.1em",
              padding: "0.8em 1em",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
              color: msg.includes("Pluie") 
                ? "#4FC3F7" // Bleu clair lumineux pour la pluie
                : msg.includes("couvert") || msg.includes("nuageux")
                ? "#FFB74D" // Orange clair pour couvert/nuageux
                : "#81C784" // Vert clair lumineux pour pas de pluie
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