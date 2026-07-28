import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
    if (ms <= 0) return "Available now";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

type Props = {
    /** Target end timestamp in ms (e.g. invoice.created_at + 25 days). */
    endsAt: number;
    prefix?: string;
    className?: string;
    onComplete?: () => void;
};

export default function CountdownTimer({ endsAt, prefix = "Available in", className, onComplete }: Props) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const remaining = endsAt - now;

    useEffect(() => {
        if (remaining <= 0 && onComplete) onComplete();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining <= 0]);

    if (remaining <= 0) {
        return <span className={className}>Available now</span>;
    }

    return (
        <span className={className}>
            {prefix} {formatRemaining(remaining)}
        </span>
    );
}