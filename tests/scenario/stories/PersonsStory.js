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
        await this.show();
        await this.update();
        await this.del();

        await this.prepareTransactions();

        await this.deleteFromUpdate();
    }

    async create() {
        setBlock('Create persons', 2);

        const data = [
            { name: '&&<div>' },
            { name: 'Alex' },
            { name: 'Maria' },
            { name: 'Johnny' },
            { name: 'Иван' },
            // Try to submit person with empty name
            { name: '' },
            // Try to submit person with existing name
            { name: 'Alex' },
        ];

        await App.scenario.runner.runGroup(PersonTests.create, data);
    }

    async update() {
        setBlock('Update persons', 2);

        const data = [{
            pos: 4,
            name: 'Ivan<',
        }, {
            // Try to submit person with empty name
            pos: 0,
            name: '',
        }, {
            // Try to submit person with existing name
            pos: 0,
            name: 'Alex',
        }, {
            // Try to update case in person name
            pos: 2,
            name: 'MARIA',
        }];

        await App.scenario.runner.runGroup(PersonTests.update, data);
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
}
