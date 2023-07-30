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
        await this.duplicate();
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
            { action: Actions.inputDestAmount, data: '1' },
            { action: Actions.inputIntervalStep, data: '' },
        ]);

        await Actions.createAndSubmit('Invalid interval step', [
            { action: Actions.inputDestAmount, data: '1' },
            { action: Actions.inputIntervalStep, data: '0' },
        ]);

        await Actions.createAndSubmit('Invalid start date', [
            { action: Actions.inputDestAmount, data: '1' },
            { action: Actions.inputStartDate, data: '' },
        ]);
    }

    async create() {
        setBlock('Create scheduled transaction', 1);

        const {
            CREDIT_CARD,
        } = App.scenario;

        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '1000' },
            { action: Actions.inputComment, data: 'some fee' },
            { action: Actions.inputStartDate, data: App.datesFmt.weekAgo },
        ]);

        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '100' },
            { action: Actions.inputComment, data: 'Daily expense' },
            { action: Actions.changeIntervalType, data: INTERVAL_DAY },
            { action: Actions.selectStartDate, data: App.dates.weekAfter },
        ]);

        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '100000' },
            { action: Actions.inputComment, data: 'One time expense' },
            { action: Actions.toggleEnableRepeat },
        ]);

        await Actions.createAndSubmit([
            { action: Actions.changeTransactionType, data: INCOME },
            { action: Actions.inputSrcAmount, data: '500' },
            { action: Actions.inputComment, data: 'Percents' },
            { action: Actions.selectMonthDayOffset, data: 31 },
            { action: Actions.inputEndDate, data: App.datesFmt.yearAfter },
        ]);

        await Actions.createAndSubmit([
            { action: Actions.changeTransactionType, data: INCOME },
            { action: Actions.inputSrcAmount, data: '75000' },
            { action: Actions.inputComment, data: 'Annual percents' },
            { action: Actions.changeIntervalType, data: INTERVAL_YEAR },
            { action: Actions.selectMonthDayOffset, data: 31 },
            { action: Actions.selectMonthOffset, data: 11 },
            { action: Actions.toggleEnableRepeat },
            { action: Actions.toggleEnableRepeat },
        ]);

        await Actions.createAndSubmit([
            { action: Actions.changeTransactionType, data: TRANSFER },
            { action: Actions.inputSrcAmount, data: '5000' },
            { action: Actions.changeIntervalType, data: INTERVAL_WEEK },
            { action: Actions.selectWeekDayOffset, data: 4 },
            { action: Actions.selectEndDate, data: App.dates.yearAfter },
        ]);

        await Actions.createAndSubmit([
            { action: Actions.changeTransactionType, data: DEBT },
            { action: Actions.inputDestAmount, data: '1000' },
            { action: Actions.inputIntervalStep, data: '6' },
            { action: Actions.selectMonthDayOffset, data: 1 },
            { action: Actions.selectEndDate, data: App.dates.tomorrow },
            { action: Actions.clearEndDate },
        ]);

        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '7' },
            { action: Actions.changeIntervalType, data: INTERVAL_WEEK },
            { action: Actions.selectWeekdaysOffset },
        ]);
        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '8' },
            { action: Actions.changeIntervalType, data: INTERVAL_WEEK },
            { action: Actions.selectWeekDayOffset, data: [] },
        ]);
        await Actions.createAndSubmit([
            { action: Actions.changeSrcAccount, data: CREDIT_CARD },
            { action: Actions.changeTransactionType, data: LIMIT_CHANGE },
            { action: Actions.inputDestAmount, data: '9' },
            { action: Actions.toggleEnableRepeat },
        ]);
        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '10' },
            { action: Actions.changeIntervalType, data: INTERVAL_WEEK },
            { action: Actions.selectWeekendOffset },
        ]);
        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '11' },
        ]);
        await Actions.createAndSubmit([
            { action: Actions.inputDestAmount, data: '12' },
        ]);
    }

    async update() {
        setBlock('Update scheduled transaction', 1);

        await Actions.updateAndSubmit(0, [
            { action: Actions.changeIntervalType, data: INTERVAL_WEEK },
            { action: Actions.selectWeekDayOffset, data: 2 },
        ]);

        await Actions.updateAndSubmit(7, [
            { action: Actions.selectWeekDayOffset, data: [2, 4, 6] },
        ]);

        setBlock('Update scheduled Credit limit change transaction', 2);
        await Actions.updateAndSubmit(9, [
            { action: Actions.inputDestAmount, data: '900' },
            { action: Actions.toggleEnableRepeat },
        ]);
    }

    async duplicate() {
        setBlock('Duplicate scheduled transaction', 1);

        await Actions.duplicateAndSubmit(0, [
            { action: Actions.selectWeekDayOffset, data: 4 },
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
