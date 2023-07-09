import { asArray, assert, setBlock } from 'jezve-test';
import { App } from '../../../Application.js';
import * as Actions from '../../actions/api/reminder.js';
import { formatProps } from '../../../common.js';

const confirmReminders = async () => {
    setBlock('Confirm reminders', 2);

    const {
        REMINDER_EXPENSE_1_1,
    } = App.scenario;

    const data = [{
        id: REMINDER_EXPENSE_1_1,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.confirm(params);
        assert(res, 'Failed to confirm reminder');
    }, data);
};

const confirmRemindersInvalid = async () => {
    setBlock('Confirm reminders with invalid data', 2);

    const data = [{
        id: 0,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.confirm(params);
        assert(!res, 'Reminder confirmed with invalid request');
    }, data);
};

const confirmRemindersWithChainedRequest = async () => {
    setBlock('Confirm reminders with chained request', 2);

    const { REMINDER_INCOME_2_1 } = App.scenario;

    const data = [{
        id: REMINDER_INCOME_2_1,
        returnState: {
            reminders: {},
        },
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.confirm(params);
        assert(res, 'Failed to confirm reminder');
    }, data);
};

const confirmUpcomingReminders = async () => {
    setBlock('Confirm upcoming reminders', 2);

    const { data: reminders } = App.state.getUpcomingReminders();

    const data = [{
        upcoming: {
            schedule_id: reminders[0].schedule_id,
            date: reminders[0].date,
        },
    }, {
        upcoming: [{
            schedule_id: reminders[1].schedule_id,
            date: reminders[1].date,
        }, {
            schedule_id: reminders[2].schedule_id,
            date: reminders[2].date,
        }],
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.confirm(params);
        assert(res, 'Failed to confirm upcoming reminder');
    }, data);
};

const getInvalidUpcomingData = () => {
    const { data: reminders } = App.state.getUpcomingReminders();

    return [
        // Empty 'upcoming' object
        { upcoming: {} },
        { upcoming: [] },
        // Invalid 'upcoming' value
        { upcoming: null },
        { upcoming: [null] },
        // No 'date' field
        {
            upcoming: {
                schedule_id: reminders[0].schedule_id,
            },
        },
        // No 'schedule_id' field
        {
            upcoming: {
                date: reminders[0].date,
            },
        },
        // Mixing valid and invalid objects
        {
            upcoming: [{
                schedule_id: reminders[1].schedule_id,
                date: reminders[1].date,
            }, null],
        },
    ];
};

const confirmUpcomingRemindersInvalid = async () => {
    setBlock('Confirm upcoming reminders with invalid data', 2);

    const data = getInvalidUpcomingData();

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.confirm(params);
        assert(!res, 'Reminder confirmed with invalid request');
    }, data);
};

const confirmCancelledReminders = async () => {
    setBlock('Confirm cancelled reminders', 2);

    const { REMINDER_TRANSFER_1_1 } = App.scenario;

    const data = [{
        id: REMINDER_TRANSFER_1_1,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.confirm(params);
        assert(res, 'Failed to confirm reminder');
    }, data);
};

const cancelReminders = async () => {
    setBlock('Cancel reminders', 2);

    const { REMINDER_TRANSFER_1_1, REMINDER_DEBT_1_1 } = App.scenario;

    const data = [{
        id: REMINDER_TRANSFER_1_1,
    }, {
        id: REMINDER_DEBT_1_1,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.cancel(params);
        assert(res, 'Failed to cancel reminder');
    }, data);
};

const cancelRemindersInvalid = async () => {
    setBlock('Cancel reminders with invalid data', 2);

    const data = [{
        id: 0,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.cancel(params);
        assert(!res, 'Reminder cancelled with invalid request');
    }, data);
};

const cancelRemindersWithChainedRequest = async () => {
    setBlock('Cancel reminders with chained request', 2);

    const { REMINDER_LIMIT_1_1 } = App.scenario;

    const data = [{
        id: REMINDER_LIMIT_1_1,
        returnState: {
            reminders: {},
        },
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.cancel(params);
        assert(res, 'Failed to cancel reminder');
    }, data);
};

const cancelUpcomingReminders = async () => {
    setBlock('Cancel upcoming reminders', 2);

    const { data: reminders } = App.state.getUpcomingReminders();

    const data = [{
        upcoming: {
            schedule_id: reminders[0].schedule_id,
            date: reminders[0].date,
        },
    }, {
        upcoming: [{
            schedule_id: reminders[1].schedule_id,
            date: reminders[1].date,
        }, {
            schedule_id: reminders[2].schedule_id,
            date: reminders[2].date,
        }],
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.cancel(params);
        assert(res, 'Failed to cancel upcoming reminder');
    }, data);
};

const cancelUpcomingRemindersInvalid = async () => {
    setBlock('Cancel upcoming reminders with invalid data', 2);

    const data = getInvalidUpcomingData();

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.cancel(params);
        assert(!res, 'Reminder canceled with invalid request');
    }, data);
};

const cancelConfirmedReminders = async () => {
    setBlock('Cancel confirmed reminders', 2);

    const { REMINDER_INCOME_2_1 } = App.scenario;

    const data = [{
        id: REMINDER_INCOME_2_1,
    }];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.cancel(params);
        assert(res, 'Failed to cancel reminder');
    }, data);
};

const read = async () => {
    setBlock('Read reminders by ids', 2);

    const { REMINDER_EXPENSE_1_1, REMINDER_TRANSFER_1_1, REMINDER_LIMIT_1_1 } = App.scenario;

    const data = [
        REMINDER_EXPENSE_1_1,
        [REMINDER_TRANSFER_1_1, REMINDER_LIMIT_1_1],
    ];

    await App.scenario.runner.runGroup(async (params) => {
        const res = await Actions.read(params);
        const ids = asArray(params);

        assert(
            Array.isArray(res)
            && res.length === ids.length
            && res.every((item) => !!item),
            `Failed to read reminder: { ${formatProps(params)} }`,
        );
    }, data);
};

const list = async () => {
    setBlock('Reminders list', 2);

    const { SCHEDULED_TR_EXPENSE_1 } = App.scenario;

    const data = [
        {},
        { schedule_id: SCHEDULED_TR_EXPENSE_1 },
    ];

    await App.scenario.runner.runGroup(Actions.list, data);
};

const upcoming = async () => {
    setBlock('Upcoming reminders list', 2);

    const data = [
        {},
    ];

    await App.scenario.runner.runGroup(Actions.upcoming, data);
};

export const apiRemindersTests = {
    async confirmRemindersTests() {
        await confirmReminders();
        await confirmRemindersInvalid();
        await confirmRemindersWithChainedRequest();
        await confirmUpcomingReminders();
        await confirmUpcomingRemindersInvalid();
    },

    async cancelRemindersTests() {
        await cancelReminders();
        await cancelRemindersInvalid();
        await cancelRemindersWithChainedRequest();
        await cancelUpcomingReminders();
        await cancelUpcomingRemindersInvalid();
    },

    async confirmCancelledTests() {
        await confirmCancelledReminders();
    },

    async cancelConfirmedTests() {
        await cancelConfirmedReminders();
    },

    async listTests() {
        await read();
        await list();
        await upcoming();
    },

    async run() {
        await this.confirmRemindersTests();
        await this.cancelRemindersTests();
        await this.confirmCancelledTests();
        await this.cancelConfirmedTests();
        await this.listTests();
    },
};
