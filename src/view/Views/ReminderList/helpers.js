import { App } from '../../Application/App.js';

/** Returns reminders group by date setting value */
export const getRemindersGroupByDate = () => (
    App.model.profile.settings.rem_group_by_date
);
