export type * from './auth';
export type * from './navigation';
export type * from './ui';

export type SharedData = {
    name: string;
    auth: {
        user: import('./auth').User;
    };
    sidebarOpen: boolean;
    [key: string]: unknown;
};
