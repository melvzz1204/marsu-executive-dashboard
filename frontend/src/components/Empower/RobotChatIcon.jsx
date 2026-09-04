import { useEffect, useState } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const RobotChatIcon = ({ size = 42 }) => {
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event) => {
      const horizontal = (event.clientX / window.innerWidth - 0.5) * 2;
      const vertical = (event.clientY / window.innerHeight - 0.5) * 2;

      setGaze({
        x: clamp(horizontal, -1, 1),
        y: clamp(vertical, -1, 1),
      });
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  const pupilOffsetX = gaze.x * 3;
  const pupilOffsetY = gaze.y * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Empower AI robot"
      className="overflow-visible"
    >
      <path
        d="M32 8v5"
        stroke="#D4AF37"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="6" r="3" fill="#FFD700" />
      <rect
        x="10"
        y="14"
        width="44"
        height="38"
        rx="13"
        fill="#FFF8E1"
        stroke="#D4AF37"
        strokeWidth="2.5"
      />
      <path d="M10 27h44v12H10z" fill="#660033" opacity="0.95" />
      <circle cx="23" cy="33" r="7" fill="#FFF8E1" opacity="0.95" />
      <circle cx="41" cy="33" r="7" fill="#FFF8E1" opacity="0.95" />
      <circle
        cx={23 + pupilOffsetX}
        cy={33 + pupilOffsetY}
        r="3.2"
        fill="#660033"
      />
      <circle
        cx={41 + pupilOffsetX}
        cy={33 + pupilOffsetY}
        r="3.2"
        fill="#660033"
      />
      <path
        d="M25 45c3.5 2.5 10.5 2.5 14 0"
        fill="none"
        stroke="#660033"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M10 28H6m52 0h-4"
        stroke="#D4AF37"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="24" y="52" width="16" height="4" rx="2" fill="#D4AF37" />
    </svg>
  );
};

export default RobotChatIcon;
