import React from "react";
import FlipNumbers from "react-flip-numbers";

function formatIndianNumber(num: number | string, decimals = 0) {
  let [intPart, decPart] = String(num).split(".");
  let lastThree = intPart.slice(-3);
  let otherNumbers = intPart.slice(0, -3);
  if (otherNumbers !== "")
    lastThree = "," + lastThree;
  let formatted =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  if (decPart && decimals > 0) {
    formatted += "." + decPart.slice(0, decimals);
  }
  return formatted;
}

interface SlidingNumberProps {
  value: number | string;
  width?: number; // width of each digit (default 14)
  height?: number; // height of each digit (default 22)
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  color?: string; // color for digits
  fontFamily?: string; // font for digits
}

const SlidingNumber: React.FC<SlidingNumberProps> = ({
  value,
  width = 14,
  height = 22,
  className = "",
  prefix = "",
  suffix = "",
  decimals = 0,
  color = "#222",
  fontFamily = "'Share Tech Mono', 'Roboto Mono', 'Menlo', monospace",
}) => {
  // Format value as string with decimals if needed
  let displayValue = value;
  if (typeof value === "number") {
    displayValue = formatIndianNumber(value.toFixed(decimals), decimals);
  }
  // Split into array of {type, value} for rendering
  const parts = String(displayValue).split("").map((char, i) => {
    if (/[0-9]/.test(char)) {
      return { type: "digit", value: char, key: `d-${i}` };
    } else {
      return { type: "sep", value: char, key: `s-${i}` };
    }
  });
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily,
        fontSize: '1.15em',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        fontWeight: 600,
        textRendering: 'optimizeLegibility',
      }}
    >
      {prefix && <span>{prefix}</span>}
      {parts.map(part =>
        part.type === "digit" ? (
          <FlipNumbers
            key={part.key}
            height={height}
            width={width}
            color={color}
            background="transparent"
            play
            perspective={800}
            duration={2.2}
            numbers={part.value}
            fontFamily={fontFamily}
            // Only animate the digit
          />
        ) : (
          <span key={part.key} style={{ fontFamily, color: '#888', fontWeight: 400 }}>{part.value}</span>
        )
      )}
      {suffix && <span>{suffix}</span>}
    </span>
  );
};

export default SlidingNumber; 