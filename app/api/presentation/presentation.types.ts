// presentations.types.ts

/* ---------- Common ---------- */

export interface ApiImage {
    id: number;
    full: string;
}

export interface PresentationTax {
    year: string[];
    stand_type: string[];
    expo: string[];
}

/* ---------- Slides base ---------- */

interface SlideBase<TType extends string, TFields> {
    id: number;
    type: TType;
    slide_title: string;
    fields: TFields;
}

/* ---------- Slide types ---------- */

export type TextSlide = SlideBase<
    'text',
    {
        text_heading: string;
        text_body: string;
    }
>;

export type PhotoTextSlide = SlideBase<
    'photo_text',
    {
        pt_heading: string;
        pt_images: ApiImage[];
    }
>;

export type StandViewSlide = SlideBase<
    'stand_view',
    {
        sv_image: ApiImage;
    }
>;

export type BeforeAfterSlide = SlideBase<
    'before_after',
    {
        ba_before: ApiImage;
        ba_after: ApiImage;
    }
>;

export interface LegendItemAttr {
    label: string;
    value: string;
}

export interface LegendItem {
    title: string;
    image: number;
    full: string;
    text: string;
    attrs: LegendItemAttr[];
}

export type LegendSlide = SlideBase<
    'legend',
    {
        leg_items: LegendItem[];
    }
>;

export type ContactsSlide = SlideBase<
    'contacts',
    {
        ct_name: string;
        ct_tg: string;
        ct_wa: string;
    }
>;

export type VideoSlide = SlideBase<
    'video',
    {
        vid_url: string;
        vid_embed: string;
        vid_provider: 'youtube' | 'vimeo' | string;
    }
>;

/* ---------- Union ---------- */

export type PresentationSlide =
    | TextSlide
    | PhotoTextSlide
    | StandViewSlide
    | BeforeAfterSlide
    | LegendSlide
    | ContactsSlide
    | VideoSlide;

/* ---------- Presentation ---------- */

export interface Presentation {
    id: number;
    title: string;
    theme: 'light' | 'dark' | string;
    show_first_slide?: boolean;
    project_size: number;
    tax: PresentationTax;
    slides: PresentationSlide[];
}
