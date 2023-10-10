import { App } from '../../Application/App.js';

export const ANY_TYPE = 0;

/** Returns accounts sort setting value */
export const getCategoriesSortMode = () => (
    App.model.profile.settings.sort_categories
);
