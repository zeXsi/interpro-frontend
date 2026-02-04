import { useEffect, useState } from 'react';

export function useActiveSection(threshold = 0.3) {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (window.innerWidth <= 1024) return;

        const sections = document.querySelectorAll<HTMLElement>('section[id]');

        const observer = new IntersectionObserver(
            (entries) => {
                let maxRatio = 0;
                let currentId: string | null = null;

                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
                        maxRatio = entry.intersectionRatio;
                        currentId = entry.target.id;
                    }
                });

                if (currentId) setActiveId(currentId);
            },
            {
                threshold,
                rootMargin: '-20% 0px -40% 0px',
            }
        );

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, [threshold]);

    return activeId;
}

