import { setBlock, TestStory } from 'jezve-test';
import * as PersonTests from '../../run/person.js';
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
        });
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Persons', 1);

        await PersonTests.securityTests();

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

        await PersonTests.create();
        await PersonTests.inputName('&&<div>');
        await PersonTests.submit();

        await PersonTests.create();
        await PersonTests.inputName('Alex');
        await PersonTests.submit();

        await PersonTests.create();
        await PersonTests.inputName('Maria');
        await PersonTests.submit();

        await PersonTests.create();
        await PersonTests.inputName('Johnny');
        await PersonTests.submit();

        await PersonTests.create();
        await PersonTests.inputName('Иван');
        await PersonTests.submit();

        // Try to submit person with empty name
        await PersonTests.create();
        await PersonTests.inputName('');
        await PersonTests.submit();

        // Try to submit person with existing name
        await PersonTests.create();
        await PersonTests.inputName('Alex');
        await PersonTests.submit();
    }

    async update() {
        setBlock('Update persons', 2);

        await PersonTests.update(4);
        await PersonTests.inputName('Ivan<');
        await PersonTests.submit();

        // Try to submit person with empty name
        await PersonTests.update(0);
        await PersonTests.inputName('');
        await PersonTests.submit();

        // Try to submit person with existing name
        await PersonTests.update(0);
        await PersonTests.inputName('Alex');
        await PersonTests.submit();

        // Update case in person name
        await PersonTests.update(2);
        await PersonTests.inputName('MARIA');
        await PersonTests.submit();
    }

    async deleteFromContextMenu() {
        setBlock('Delete person from context menu', 1);

        await PersonTests.deleteFromContextMenu(0);
    }

    async del() {
        setBlock('Delete persons', 2);

        const data = [
            [0],
            [0, 2],
        ];

        await App.scenario.runner.runGroup(PersonTests.del, data);
    }

    async deleteFromUpdate() {
        setBlock('Delete person from update view', 2);

        const data = [
            0,
        ];

        await App.scenario.runner.runGroup(PersonTests.delFromUpdate, data);
    }

    async hide() {
        setBlock('Hide persons', 2);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup(PersonTests.hide, data);
    }

    async show() {
        setBlock('Show persons', 2);

        const data = [
            [2],
            [0, 4],
        ];

        await App.scenario.runner.runGroup(PersonTests.show, data);
    }

    async exportCSV() {
        setBlock('Export persons', 1);

        const data = [
            [0],
            [0, 1],
        ];

        await App.scenario.runner.runGroup(PersonTests.exportTest, data);
    }

    async select() {
        setBlock('Select persons', 1);

        const data = [
            [0],
            [1, 2],
        ];

        setBlock('Toggle select persons', 2);
        await App.scenario.runner.runGroup(PersonTests.toggleSelect, data);

        setBlock('Select/deselect all persons', 2);
        await PersonTests.selectAll();
        await PersonTests.deselectAll();
    }

    async sort() {
        setBlock('Sort persons', 1);

        setBlock('Sort by name', 2);
        await PersonTests.toggleSortByName();
        await PersonTests.toggleSortByName();

        setBlock('Sort by date', 2);
        await PersonTests.toggleSortByDate();
        await PersonTests.toggleSortByDate();

        setBlock('Sort manually', 2);
        await PersonTests.sortManually();
    }

    async details() {
        setBlock('Person details', 1);

        await PersonTests.showDetails({ index: 0 });
        await PersonTests.closeDetails();
        await PersonTests.showDetails({ index: 1 });
        await PersonTests.showDetails({ index: 2 });
        await PersonTests.showDetails({ index: 2 });
        await PersonTests.closeDetails();
        await PersonTests.showDetails({ index: 0, directNavigate: true });
        await PersonTests.showDetails({ index: 1, directNavigate: true });
        await PersonTests.closeDetails();
    }
}
