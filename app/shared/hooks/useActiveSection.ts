import { useEffect, useState } from 'react';

export function useActiveSection() {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        const sections = document.querySelectorAll<HTMLElement>('section[id]');
        if (!sections.length) return;

        const handleScroll = () => {
            const triggerPoint = window.innerHeight * 0.1; // 10% от верхнего края экрана
            let currentId: string | null = null;

            sections.forEach((section) => {
                const rect = section.getBoundingClientRect();
                if (rect.top <= triggerPoint && rect.bottom > triggerPoint) {
                    currentId = section.id;
                }
            });

            if (currentId && currentId !== activeId) {
                setActiveId(currentId);
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);

        handleScroll(); // сразу определить активную секцию

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [activeId]);

    return activeId;
}
