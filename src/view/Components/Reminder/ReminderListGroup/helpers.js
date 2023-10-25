import { REMINDER_UPCOMING } from '../../../Models/Reminder.js';
import { dateStringToTime, getContextIds } from '../../../utils/utils.js';
import { getStateFilter } from './reducer.js';

export const getRequestData = (state) => {
    const ids = getContextIds(state);
    if (getStateFilter(state) !== REMINDER_UPCOMING) {
        return { id: ids };
    }

    return {
        upcoming: ids.map((id) => {
            const strId = id?.toString();
            const reminder = state.items.find((item) => item?.id?.toString() === strId);
            return {
                schedule_id: reminder.schedule_id,
                date: reminder.date,
            };
        }),
    };
};

export const getListRequest = (state) => (
    (getStateFilter(state) === REMINDER_UPCOMING)
        ? {}
        : {
            page: state.pagination.page,
            range: state.pagination.range,
        }
);

export const getUpcomingListRequest = (state) => (
    (getStateFilter(state) !== REMINDER_UPCOMING)
        ? {}
        : {
            page: state.pagination.page,
            range: state.pagination.range,
        }
);

export const prepareRequest = (data, state) => ({
    ...data,
    returnState: {
        reminders: getListRequest(state),
        upcoming: getUpcomingListRequest(state),
        profile: {},
    },
});

export const getListDataFromResponse = (response) => (
    response?.data?.state?.reminders?.data
);

export const getUpcomingDataFromResponse = (response) => (
    response?.data?.state?.upcoming?.data
);

export const getUpcomingRequestData = (state) => {
    const { pagination, form } = state;

    const res = {
        page: pagination.page,
        range: pagination.range,
    };

    if (form.startDate) {
        res.startDate = dateStringToTime(form.startDate, { fixShortYear: false });
    }
    if (form.endDate) {
        res.endDate = dateStringToTime(form.endDate, { fixShortYear: false });
    }

    return res;
};
