// presentations.api.ts
import { createQuery } from 'shared/utils/querySignal';
import type { Presentation } from './presentation.types';

export const createPresentationQuery = (slug: string) => {
    const qPresentation = createQuery<Presentation | null>({
        endpoint: `https://api.interpro.murukae.ru/wp-json/interpro/v1/presentations/${slug}/`,
        initial: null,
    });

    return {
        sgPresentation: qPresentation.sg,
        getPresentation: () => qPresentation.fetch({}),
    };
};
