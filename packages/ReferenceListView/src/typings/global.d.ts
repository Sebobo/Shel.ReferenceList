declare module '*.module.css';

type ReferenceData = {
    references: {
        reference: string;
        breadcrumb: string[];
        link?: string;
        icon?: string;
        count: number;
    }[];
};
