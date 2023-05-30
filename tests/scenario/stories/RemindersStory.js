import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../../actions/reminder.js';
import * as trActions from '../../actions/transaction.js';
import { App } from '../../Application.js';

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
        setBlock('Schedule', 1);

        await this.list();
        await this.confirm();
        await this.cancel();
        await this.confirmFromContextMenu();
        await this.cancelFromContextMenu();
        await this.updateAndConfirm();
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
        await trActions.runActions([
            { action: 'inputSrcAmount', data: '100' },
        ]);
        await trActions.submit();
    }

    async detailsMode() {
        setBlock('Reminders list details mode', 1);

        await Actions.toggleMode();
        await Actions.toggleMode();
    }

    async select() {
        setBlock('Select reminders', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select reminders', 2);
        await App.scenario.runner.runGroup(Actions.toggleSelect, data);

        setBlock('Select/deselect all reminders', 2);
        await Actions.selectAll();
        await Actions.deselectAll();
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
}
