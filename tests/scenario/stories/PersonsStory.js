import { setBlock, TestStory } from 'jezve-test';
import * as Actions from '../actions/person.js';
import { App } from '../../Application.js';

export class PersonsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();
        await App.scenario.resetData({
            accounts: true,
            persons: true,
        });
    }

    async prepareTransactions() {
        await App.scenario.resetData({
            accounts: true,
            persons: true,
            categories: true,
            currencies: true,
        });
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Persons', 1);

        await Actions.securityTests();

        await this.create();
        await this.hide();
        await this.select();
        await this.sort();
        await this.details();
        await this.show();
        await this.exportCSV();
        await this.update();
        await this.deleteFromContextMenu();
        await this.del();

        await this.prepareTransactions();

        await this.deleteFromUpdate();
    }

    async create() {
        setBlock('Create persons', 2);

        await Actions.create();
        await Actions.inputName('&&<div>');
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Alex');
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Maria');
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Johnny');
        await Actions.submit();

        await Actions.create();
        await Actions.inputName('Иван');
        await Actions.submit();

        // Try to submit person with empty name
        await Actions.create();
        await Actions.inputName('');
        await Actions.submit();

        // Try to submit person with existing name
        await Actions.create();
        await Actions.inputName('Alex');
        await Actions.submit();
    }

    async update() {
        setBlock('Update persons', 2);

        await Actions.update(4);
        await Actions.inputName('Ivan<');
        await Actions.submit();

        // Try to submit person with empty name
        await Actions.update(0);
        await Actions.inputName('');
        await Actions.submit();

        // Try to submit person with existing name
        await Actions.update(0);
        await Actions.inputName('Alex');
        await Actions.submit();

        // Update case in person name
        await Actions.update(2);
        await Actions.inputName('MARIA');
        await Actions.submit();
    }

    async deleteFromContextMenu() {
        setBlock('Delete person from context menu', 1);

        await Actions.deleteFromContextMenu(0);
    }

    async del() {
        setBlock('Delete persons', 2);

        const data = [
            [0],
            [0, 2],
        ];

        await App.scenario.runner.runGroup(Actions.del, data);
    }

    async deleteFromUpdate() {
        setBlock('Delete person from update view', 2);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(Actions.delFromUpdate, data);
    }

    async hide() {
        setBlock('Hide persons', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.hide, data);
    }

    async show() {
        setBlock('Show persons', 2);

        const data = [
            [2],
            [0, 4],
        ];

        await App.scenario.runner.runGroup(Actions.show, data);
    }

    async exportCSV() {
        setBlock('Export persons', 1);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup(Actions.exportTest, data);
    }

    async select() {
        setBlock('Select persons', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select persons', 2);
        await App.scenario.runner.runGroup(Actions.toggleSelect, data);

        setBlock('Select/deselect all persons', 2);
        await Actions.selectAll();
        await Actions.deselectAll();
    }

    async sort() {
        setBlock('Sort persons', 1);

        setBlock('Sort by name', 2);
        await Actions.toggleSortByName();
        await Actions.toggleSortByName();

        setBlock('Sort by date', 2);
        await Actions.toggleSortByDate();
        await Actions.toggleSortByDate();

        setBlock('Sort manually', 2);
        await Actions.sortManually();
    }

    async details() {
        setBlock('Person details', 1);

        await Actions.showDetails({ index: 0 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 1 });
        await Actions.showDetails({ index: 2 });
        await Actions.showDetails({ index: 2 });
        await Actions.closeDetails();
        await Actions.showDetails({ index: 0, directNavigate: true });
        await Actions.showDetails({ index: 1, directNavigate: true });
        await Actions.closeDetails();
    }
}
