import { App } from '../../Application/App.js';

/** Returns accounts sort setting value */
export const getCategoriesSortMode = () => (
    App.model.profile.settings.sort_categories
);
