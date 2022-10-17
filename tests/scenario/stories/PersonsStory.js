import { setBlock } from 'jezve-test';
import { TestStory } from '../TestStory.js';
import * as PersonTests from '../../run/person.js';
import { App } from '../../Application.js';
import { api } from '../../model/api.js';

export class PersonsStory extends TestStory {
    async beforeRun() {
        await App.scenario.prepareTestUser();

        await api.profile.resetData({
            accounts: true,
            persons: true,
        });
        await App.state.fetch();
    }

    async prepareTransactions() {
        await api.profile.resetData({
            accounts: true,
            persons: true,
        });
        await App.state.fetch();
        await App.scenario.createTestData();

        await App.goToMainView();
    }

    async run() {
        setBlock('Persons', 1);

        await PersonTests.securityTests();

        await this.create();
        await this.hide();
        await this.toggleSelect();
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

    async toggleSelect() {
        setBlock('Toggle select persons', 2);

        const data = [
            [0],
            [1, 2],
        ];

        await App.scenario.runner.runGroup(PersonTests.toggleSelect, data);
    }
}
