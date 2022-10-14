import { setBlock } from 'jezve-test';
import * as PersonTests from '../run/person.js';
import { App } from '../Application.js';
import { api } from '../model/api.js';

const createTests = async () => {
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
};

const updateTests = async () => {
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
};

const deleteTests = async () => {
    setBlock('Delete persons', 2);

    const data = [
        [0],
        [0, 2],
    ];

    await App.scenario.runner.runGroup(PersonTests.del, data);
};

const deleteFromUpdateTests = async () => {
    setBlock('Delete person from update view', 2);

    const data = [
        0,
    ];

    await App.scenario.runner.runGroup(PersonTests.delFromUpdate, data);
};

const hideTests = async () => {
    setBlock('Hide persons', 2);

    const data = [
        [0],
        [0, 1],
    ];

    await App.scenario.runner.runGroup(PersonTests.hide, data);
};

const showTests = async () => {
    setBlock('Show persons', 2);

    const data = [
        [2],
        [0, 4],
    ];

    await App.scenario.runner.runGroup(PersonTests.show, data);
};

const toggleTests = async () => {
    setBlock('Toggle select persons', 2);

    const data = [
        [0],
        [1, 2],
    ];

    await App.scenario.runner.runGroup(PersonTests.toggleSelect, data);
};

const prepare = async () => {
    await App.scenario.prepareTestUser();

    await api.profile.resetData({
        accounts: true,
        persons: true,
    });
    await App.state.fetch();
};

const prepareTransactions = async () => {
    await api.profile.resetData({
        accounts: true,
        persons: true,
    });
    await App.state.fetch();
    await App.scenario.createTestData();

    await App.goToMainView();
};

export const personTests = {
    /** Run person view tests */
    async run() {
        setBlock('Persons', 1);

        await prepare();

        await PersonTests.securityTests();

        await createTests();
        await hideTests();
        await toggleTests();
        await showTests();
        await updateTests();
        await deleteTests();

        await prepareTransactions();

        await deleteFromUpdateTests();
    },
};
