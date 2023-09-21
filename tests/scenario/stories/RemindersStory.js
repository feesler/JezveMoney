import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../actions/reminder.js';
import * as trActions from '../actions/transaction.js';
import { App } from '../../Application.js';
import * as ApiActions from '../actions/api/schedule.js';
import {
    REMINDER_CANCELLED,
    REMINDER_CONFIRMED,
    REMINDER_SCHEDULED,
    REMINDER_UPCOMING,
} from '../../model/Reminder.js';
import { EXPENSE } from '../../model/Transaction.js';
import { INTERVAL_NONE } from '../../common.js';

export class RemindersStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            currencies: true,
            schedule: true,
        });

        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Reminders', 1);

        await this.list();
        await this.confirm();
        await this.cancel();
        await this.confirmFromContextMenu();
        await this.cancelFromContextMenu();
        await this.updateAndConfirm();
        await this.selectReminderDialog();
        await this.selectReminder();
        await this.removeReminder();
        await this.dialogPagination();
        await this.dialogFilters();
        await this.filters();
        await this.upcoming();
        await this.confirmCancelled();
        await this.cancelConfirmed();
        await this.noLongestInterval();
    }

    async list() {
        await this.detailsMode();
        await this.select();
        await this.details();
        await this.pagination();
    }

    async confirm() {
        setBlock('Confirm reminders', 1);

        const data = [
            0,
            [1, 2],
        ];

        await App.scenario.runner.runGroup(Actions.confirm, data);
    }

    async cancel() {
        setBlock('Cancel reminders', 1);

        const data = [
            0,
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.cancel, data);
    }

    async upcoming() {
        setBlock('Upcoming reminders', 1);

        await Actions.filterByState({ state: REMINDER_UPCOMING });
        await Actions.showMore();

        await Actions.confirm(0);
        await Actions.confirmFromContextMenu(0);

        await Actions.cancel(0);
        await Actions.cancelFromContextMenu(0);

        await Actions.updateFromContextMenu(0);
        await trActions.inputDate(App.formatInputDate(App.dates.yesterday));
        await trActions.submit();
    }

    async confirmCancelled() {
        setBlock('Confirm cancelled reminders', 1);

        await Actions.filterByState({ state: REMINDER_CANCELLED });
        await Actions.confirm(0);
        await Actions.confirmFromContextMenu(0);
    }

    async cancelConfirmed() {
        setBlock('Cancel confirmed reminders', 1);

        await Actions.filterByState({ state: REMINDER_CONFIRMED });
        await Actions.cancel(0);
        await Actions.cancelFromContextMenu(0);
    }

    async confirmFromContextMenu() {
        setBlock('Confirm reminder from context menu', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.confirmFromContextMenu, data);
    }

    async cancelFromContextMenu() {
        setBlock('Cancel reminder from context menu', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.cancelFromContextMenu, data);
    }

    async updateAndConfirm() {
        setBlock('Edit reminder transaction and submit', 1);

        await Actions.updateFromContextMenu(0);
        await trActions.inputDate(App.formatInputDate(App.dates.yesterday));
        await trActions.submit();
    }

    async selectReminderDialog() {
        setBlock('Open and close \'Select reminder\' dialog', 1);

        await Actions.updateFromContextMenu(0);
        await trActions.openReminderDialog();
        await trActions.closeReminderDialog();
        await trActions.submit();
    }

    async selectReminder() {
        setBlock('Select reminder to confirm', 1);

        await Actions.updateFromContextMenu(0);
        await trActions.openReminderDialog();
        await trActions.selectReminderByIndex(1);
        await trActions.submit();
    }

    async removeReminder() {
        setBlock('Remove reminder', 1);

        await Actions.updateFromContextMenu(0);
        await trActions.removeReminder();
        await trActions.submit();
    }

    async dialogPagination() {
        setBlock('\'Select reminder\' dialog pagination', 1);

        await Actions.updateFromContextMenu(0);
        await trActions.openReminderDialog();

        await trActions.goToRemindersLastPage();
        await trActions.goToRemindersPrevPage();
        await trActions.goToRemindersNextPage();
        await trActions.goToRemindersFirstPage();

        await trActions.showMoreReminders();
        await trActions.goToRemindersFirstPage();
        await trActions.showMoreReminders();
    }

    async dialogFilters() {
        setBlock('\'Select reminder\' dialog filters', 1);

        await Actions.updateFromContextMenu(0);
        await trActions.openReminderDialog();

        await trActions.filterRemindersByState(REMINDER_CONFIRMED);
        await trActions.filterRemindersByState(REMINDER_UPCOMING);
        await trActions.filterRemindersByState(REMINDER_CANCELLED);
        await trActions.filterRemindersByState(REMINDER_SCHEDULED);

        await trActions.selectRemindersEndDateFilter(App.dates.monthAfter);
        await trActions.selectRemindersStartDateFilter(App.dates.weekAfter);
        await trActions.clearRemindersEndDateFilter();
        await trActions.clearRemindersStartDateFilter();
        await trActions.selectRemindersStartDateFilter(App.dates.monthAgo);
        await trActions.selectRemindersEndDateFilter(App.dates.tomorrow);
        await trActions.clearAllRemindersFilters();
    }

    async detailsMode() {
        setBlock('Reminders list details mode', 1);

        await Actions.toggleMode();
        await Actions.toggleMode();
    }

    async select() {
        setBlock('Select reminders', 1);

        setBlock('Toggle select reminders', 2);
        await Actions.toggleSelect(0);
        await Actions.toggleSelect(0);
        await Actions.toggleSelect([1, 2]);
        await Actions.toggleSelect([1, 2]);

        setBlock('Select/deselect all reminders', 2);
        await Actions.selectAll();
        await Actions.deselectAll();

        setBlock('Check selection after change page', 2);
        await Actions.toggleSelect(0);
        await Actions.goToNextPage();
        await Actions.goToPrevPage();
        await Actions.showMore();
        await Actions.goToFirstPage();
        await Actions.toggleSelect(0);
    }

    async details() {
        setBlock('Reminder details', 1);

        await Actions.showDetails({ index: 0 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 1 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 0, directNavigate: true });
        await Actions.showDetails({ index: 1, directNavigate: true });
        await Actions.closeDetails();
    }

    async pagination() {
        setBlock('Reminders list pagination', 1);

        await Actions.goToLastPage();
        await Actions.goToPrevPage();
        await Actions.goToNextPage();
        await Actions.goToFirstPage();

        await Actions.showMore();
        await Actions.goToFirstPage();
        await Actions.showMore();
    }

    async filters() {
        setBlock('Filter reminders', 1);

        await Actions.filterByState({ state: REMINDER_CONFIRMED });
        await Actions.filterByState({ state: REMINDER_CANCELLED });
        await Actions.filterByState({ state: REMINDER_CANCELLED, directNavigate: true });
        await Actions.filterByState({ state: REMINDER_CONFIRMED, directNavigate: true });
        await Actions.filterByState({ state: REMINDER_SCHEDULED });
        await Actions.filterByState({ state: REMINDER_UPCOMING });
        await Actions.filterByState({ state: REMINDER_UPCOMING, directNavigate: true });

        await Actions.selectEndDateFilter({ date: App.dates.monthAfter });
        await Actions.selectStartDateFilter({ date: App.dates.weekAfter });
        await Actions.clearEndDateFilter();
        await Actions.clearStartDateFilter();
        await Actions.selectStartDateFilter(
            { date: App.dates.weekAfter, directNavigate: true },
        );
        await Actions.selectEndDateFilter(
            { date: App.dates.monthAgo, directNavigate: true },
        );
        await Actions.showMore();
        await Actions.showMore();

        await Actions.clearAllFilters();
        await Actions.selectEndDateFilter(
            { date: App.dates.monthAgo, directNavigate: true },
        );
        await Actions.clearAllFilters({ directNavigate: true });

        await Actions.filterByState({ state: REMINDER_SCHEDULED });
        await Actions.selectStartDateFilter({ date: App.dates.monthAgo });
        await Actions.selectEndDateFilter({ date: App.dates.weekAgo });

        await Actions.filterByState({ state: REMINDER_CONFIRMED });
        await Actions.selectEndDateFilter({ date: App.dates.yesterday });

        await Actions.filterByState({ state: REMINDER_CANCELLED });
        await Actions.clearEndDateFilter();
        await Actions.clearAllFilters();
    }

    async noLongestInterval() {
        setBlock('No longest interval test', 1);

        await App.scenario.resetData({
            schedule: true,
        });

        const {
            ACC_RUB,
            INVEST_CATEGORY,
        } = App.scenario;

        const data = {
            type: EXPENSE,
            src_id: ACC_RUB,
            src_amount: 100000,
            comment: 'One time expense',
            category_id: INVEST_CATEGORY,
            start_date: App.datesSec.weekAfter,
            end_date: null,
            interval_type: INTERVAL_NONE,
            interval_step: 0,
            interval_offset: 0,
        };

        await ApiActions.extractAndCreate(data);

        await App.view.navigateToReminders();
        await Actions.filterByState({ state: REMINDER_UPCOMING });
    }
}
