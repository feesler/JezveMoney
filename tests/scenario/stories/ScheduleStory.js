import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../actions/schedule.js';
import { App } from '../../Application.js';
import {
    DEBT,
    INCOME,
    LIMIT_CHANGE,
    TRANSFER,
} from '../../model/Transaction.js';
import {
    INTERVAL_DAY,
    INTERVAL_WEEK,
    INTERVAL_YEAR,
} from '../../common.js';

export class ScheduleStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            currencies: true,
            schedule: true,
        });

        await App.scenario.createUserCurrencies();
        await App.scenario.createAccounts();
        await App.scenario.createPersons();
        await App.scenario.createCategories();
        await App.scenario.createTransactions();

        await App.goToMainView();
    }

    async run() {
        setBlock('Schedule', 1);

        await Actions.securityTests();

        await this.validation();
        await this.create();
        await this.list();
        await this.update();
        await this.finishFromContextMenu();
        await this.finish();
        await this.deleteFromContextMenu();
        await this.del();
        await this.deleteFromUpdate();
    }

    async list() {
        await this.detailsMode();
        await this.select();
        await this.details();
        await this.pagination();
    }

    async validation() {
        setBlock('Scheduled transaction form validation', 1);

        await Actions.createAndSubmit('Invalid interval step', [
            { action: 'inputDestAmount', data: '1' },
            { action: 'inputIntervalStep', data: '' },
        ]);

        await Actions.createAndSubmit('Invalid interval step', [
            { action: 'inputDestAmount', data: '1' },
            { action: 'inputIntervalStep', data: '0' },
        ]);

        await Actions.createAndSubmit('Invalid start date', [
            { action: 'inputDestAmount', data: '1' },
            { action: 'inputStartDate', data: '' },
        ]);
    }

    async create() {
        setBlock('Create scheduled transaction', 1);

        const {
            CREDIT_CARD,
        } = App.scenario;

        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '1000' },
            { action: 'inputComment', data: 'some fee' },
            { action: 'inputStartDate', data: App.datesFmt.weekAgo },
        ]);

        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '100' },
            { action: 'inputComment', data: 'Daily expense' },
            { action: 'changeIntervalType', data: INTERVAL_DAY },
            { action: 'selectStartDate', data: App.dates.weekAfter },
        ]);

        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '100000' },
            { action: 'inputComment', data: 'One time expense' },
            { action: 'toggleEnableRepeat' },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '500' },
            { action: 'inputComment', data: 'Percents' },
            { action: 'selectMonthDayOffset', data: 31 },
            { action: 'inputEndDate', data: App.datesFmt.yearAfter },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: INCOME },
            { action: 'inputSrcAmount', data: '75000' },
            { action: 'inputComment', data: 'Annual percents' },
            { action: 'changeIntervalType', data: INTERVAL_YEAR },
            { action: 'selectMonthDayOffset', data: 31 },
            { action: 'selectMonthOffset', data: 11 },
            { action: 'toggleEnableRepeat' },
            { action: 'toggleEnableRepeat' },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: TRANSFER },
            { action: 'inputSrcAmount', data: '5000' },
            { action: 'changeIntervalType', data: INTERVAL_WEEK },
            { action: 'selectWeekDayOffset', data: 4 },
            { action: 'selectEndDate', data: App.dates.yearAfter },
        ]);

        await Actions.createAndSubmit([
            { action: 'changeTransactionType', data: DEBT },
            { action: 'inputDestAmount', data: '1000' },
            { action: 'inputIntervalStep', data: '6' },
            { action: 'selectMonthDayOffset', data: 1 },
            { action: 'selectEndDate', data: App.dates.tomorrow },
            { action: 'clearEndDate' },
        ]);

        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '7' },
            { action: 'changeIntervalType', data: INTERVAL_WEEK },
            { action: 'selectWeekDayOffset', data: [1, 2, 3, 4, 5] },
        ]);
        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '8' },
            { action: 'changeIntervalType', data: INTERVAL_WEEK },
            { action: 'selectWeekDayOffset', data: [] },
        ]);
        await Actions.createAndSubmit([
            { action: 'changeSrcAccount', data: CREDIT_CARD },
            { action: 'changeTransactionType', data: LIMIT_CHANGE },
            { action: 'inputDestAmount', data: '9' },
            { action: 'toggleEnableRepeat' },
        ]);
        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '10' },
        ]);
        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '11' },
        ]);
        await Actions.createAndSubmit([
            { action: 'inputDestAmount', data: '12' },
        ]);
    }

    async update() {
        setBlock('Update scheduled transaction', 1);

        await Actions.updateAndSubmit(0, [
            { action: 'changeIntervalType', data: INTERVAL_WEEK },
            { action: 'selectWeekDayOffset', data: 2 },
        ]);

        await Actions.updateAndSubmit(7, [
            { action: 'selectWeekDayOffset', data: [2, 4, 6] },
        ]);

        setBlock('Update scheduled Credit limit change transaction', 2);
        await Actions.updateAndSubmit(9, [
            { action: 'inputDestAmount', data: '900' },
            { action: 'toggleEnableRepeat' },
        ]);
    }

    async finishFromContextMenu() {
        setBlock('Finish scheduled transaction from context menu', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.finishFromContextMenu, data);
    }

    async finish() {
        setBlock('Finish scheduled transactions', 1);

        const data = [
            0,
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.finish, data);
    }

    async deleteFromContextMenu() {
        setBlock('Delete scheduled transaction from context menu', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.deleteFromContextMenu, data);
    }

    async del() {
        setBlock('Delete scheduled transactions', 1);

        const data = [
            0,
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.del, data);
    }

    async deleteFromUpdate() {
        setBlock('Delete scheduled transaction from update view', 1);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.delFromUpdate, data);
    }

    async detailsMode() {
        setBlock('Scheduled transactions list details mode', 1);

        await Actions.toggleMode();
        await Actions.toggleMode();
    }

    async select() {
        setBlock('Select scheduled transactions', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select scheduled transactions', 2);
        await App.scenario.runner.runGroup(Actions.toggleSelect, data);

        setBlock('Select/deselect all scheduled transaction', 2);
        await Actions.selectAll();
        await Actions.deselectAll();
    }

    async details() {
        setBlock('Scheduled transaction details', 1);

        await Actions.showDetails({ index: 0 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 1 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 0, directNavigate: true });
        await Actions.showDetails({ index: 1, directNavigate: true });
        await Actions.closeDetails();
    }

    async pagination() {
        setBlock('Scheduled transaction list pagination', 1);

        await Actions.goToLastPage();
        await Actions.goToPrevPage();
        await Actions.goToNextPage();
        await Actions.goToFirstPage();

        await Actions.showMore();
        await Actions.goToFirstPage();
        await Actions.showMore();
    }
}
