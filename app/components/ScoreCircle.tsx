const ScoreCircle = ({ score = 75 }: { score: number }) => {
    const radius = 40;
    const stroke = 8;
    const normalizedRadius = radius - stroke / 2;
    const circumference = 2 * Math.PI * normalizedRadius;
    const progress = score / 100;
    const strokeDashoffset = circumference * (1 - progress);

    return (
        <div className="relative w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px]">
            <svg
                height="100%"
                width="100%"
                viewBox="0 0 100 100"
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx="50"
                    cy="50"
                    r={normalizedRadius}
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                    fill="transparent"
                />
                {/* Partial circle with realistic ATS colors */}
                <circle
                    cx="50"
                    cy="50"
                    r={normalizedRadius}
                    stroke={score >= 85 ? "#10B981" : // Green for exceptional
                           score >= 75 ? "#059669" : // Dark green for excellent
                           score >= 65 ? "#3B82F6" : // Blue for good
                           score >= 55 ? "#F59E0B" : // Yellow for fair
                           score >= 45 ? "#F97316" : // Orange for poor
                           score >= 35 ? "#EF4444" : // Red for very poor
                           "#DC2626"} // Dark red for rejected
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>

            {/* Score and issues */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-xs sm:text-sm md:text-base">{`${score}/100`}</span>
            </div>
        </div>
    );
};

export default ScoreCircle;