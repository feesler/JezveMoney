import { App } from '../../Application/App.js';
import { REMINDER_SCHEDULED, Reminder } from '../../Models/Reminder.js';

/** Returns page number and relative index of specified absolute index */
export const getPageIndex = (index, state) => {
    if (index === -1) {
        return { page: 0, index: -1 };
    }

    const { onPage } = state.pagination;
    return {
        page: Math.floor(index / onPage) + 1,
        index: index % onPage,
    };
};

/** Returns absolute index for relative index on current page */
export const getAbsoluteIndex = (index, state) => {
    if (index === -1) {
        return index;
    }

    const { pagination } = state;
    if (!pagination) {
        return index;
    }

    const firstItemIndex = (pagination.page - 1) * pagination.onPage;
    return firstItemIndex + index;
};

/**
 * Compare transaction item with reference object
 * @param {TransactionItem} item - transaction item object
 * @param {Object} reference - imported transaction object
 */
export const isSimilarTransaction = (item, reference) => {
    if (!item || !reference) {
        throw new Error('Invalid parameters');
    }

    // Check date, source and destination accounts
    if (
        item.src_id !== reference.src_id
        || item.dest_id !== reference.dest_id
        || item.date !== reference.date
    ) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    const refSrcAmount = Math.abs(reference.src_amount);
    const refDestAmount = Math.abs(reference.dest_amount);
    if (
        (item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)
    ) {
        return false;
    }

    return true;
};

/** Return first found transaction with same date and amount as reference */
export const findSimilarTransaction = (transactions, reference) => {
    const res = transactions.find((item) => (
        item
        && !item.picked
        && isSimilarTransaction(item, reference)
    ));
    return res ?? null;
};

/** Returns array of extended reminders */
export const getExtendedReminders = () => (
    App.model.reminders.map((item) => Reminder.createExtended(item))
);

/** Returns true if both items has the same reminder selected */
export const isSameRemiderSelected = (a, b) => (
    (
        !!a.reminderId
        && a.reminderId === b.reminderId
    ) || (
        !!a.scheduleId
        && a.scheduleId === b.scheduleId
        && a.reminderDate === b.reminderDate
    )
);

/** Removes reminder from item if the same reminder is selected by reference item */
export const removeSameReminder = (item, ref) => (
    isSameRemiderSelected(item, ref)
        ? item.removeReminder()
        : item
);

/** Returns true if specified reminder is suitable for transaction */
export const isSuitableReminder = (item, reminder) => {
    if (!item || reminder?.state !== REMINDER_SCHEDULED) {
        return false;
    }

    // Check date, source and destination accounts
    if (
        item.type !== reminder.type
        || item.src_id !== reminder.src_id
        || item.dest_id !== reminder.dest_id
        || item.date !== reminder.date
    ) {
        return false;
    }

    // Check amounts
    // Source and destination amount can be swapped
    const refSrcAmount = Math.abs(reminder.src_amount);
    const refDestAmount = Math.abs(reminder.dest_amount);
    if (
        (item.src_amount !== refSrcAmount && item.src_amount !== refDestAmount)
        || (item.dest_amount !== refDestAmount && item.dest_amount !== refSrcAmount)
    ) {
        return false;
    }

    return true;
};

/** Returns first suitable reminder for specified transaction */
export const findSuitableReminder = (transaction, reminders) => (
    reminders.find((item) => (
        item
        && !item.picked
        && isSuitableReminder(transaction, item)
    )) ?? null
);

/** Updates list state */
export const getPagination = (state) => {
    const { items, pagination } = state;
    const pagesCount = Math.ceil(items.length / pagination.onPage);
    const res = {
        ...pagination,
        total: items.length,
        pagesCount,
        range: 1,
    };

    res.page = (pagesCount > 0) ? Math.min(pagesCount, res.page) : 1;

    return res;
};

/** Returns date range for current imported transactions */
export const getImportedItemsDateRange = (state) => {
    const res = { start: 0, end: 0 };
    state.items.forEach((item) => {
        if (!item.originalData) {
            return;
        }

        const time = item.originalData.date.getTime();
        if (res.start === 0) {
            res.start = time;
            res.end = time;
        } else {
            res.start = Math.min(time, res.start);
            res.end = Math.max(time, res.end);
        }
    });

    return res;
};
