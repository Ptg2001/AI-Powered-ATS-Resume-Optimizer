import React, { useEffect, useState } from "react";

const GradientTyping: React.FC<{ text: string; speed?: number }> = ({ text, speed = 300 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index > text.length) {
        index = 0;
        setDisplayedText(""); // erase before next loop
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="flex">
      {displayedText.split("").map((char, idx) => (
    <span
        key={idx}
        className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"
        style={{
            animation: "typingfadeIn 0.5s ease",
            animationDelay: `${idx * 0.05}s`,
            animationFillMode: "both",
        }}
    >
        {char}
    </span>
))}
      
    </span>
  );
};

export default GradientTyping;
