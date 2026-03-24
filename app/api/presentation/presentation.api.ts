// presentations.api.ts
import { interproApiBaseURL } from 'api/api.config';
import { createQuery } from 'shared/utils/querySignal';
import type { Presentation } from './presentation.types';

export const createPresentationQuery = (slug: string) => {
    const qPresentation = createQuery<Presentation | null>({
        endpoint: `${interproApiBaseURL}/presentations/${slug}/`,
        initial: null,
    });

    return {
        sgPresentation: qPresentation.sg,
        getPresentation: () => qPresentation.fetch({}),
    };
};
