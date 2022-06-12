import {
    test,
    copyObject,
    assert,
    setBlock,
    baseUrl,
    goTo,
} from 'jezve-test';
import { formatProps, generateId } from '../common.js';
import { PersonsView } from '../view/PersonsView.js';
import { PersonView } from '../view/PersonView.js';
import { MainView } from '../view/MainView.js';
import { App } from '../Application.js';

/** Navigate to persons list page */
const checkNavigation = async () => {
    if (!(App.view instanceof PersonsView)) {
        await App.goToMainView();
        await App.view.goToPersons();
    }
};

const submitPerson = async (params) => {
    if (!(App.view instanceof PersonView)) {
        throw new Error('Invalid view');
    }

    // Input account name
    if ('name' in params) {
        await App.view.inputName(params.name);
    }

    const validInput = App.view.isValid();
    const res = (validInput) ? App.view.getExpectedPerson() : null;

    await App.view.submit();

    if (validInput && !(App.view instanceof PersonsView)) {
        throw new Error('Fail to submit person');
    }

    return res;
};

/**
 * From persons list view go to new person view, input name and submit
 * Next check name result and callback
 * @param {Object} params
 */
export const create = async (params) => {
    await test(`Create person ({${formatProps(params)} })`, async () => {
        // Navigate to create person view
        await checkNavigation();
        await App.view.goToCreatePerson();

        const expPerson = await submitPerson(params);
        if (expPerson) {
            App.state.createPerson(expPerson);
        } else {
            await App.view.cancel();
        }

        App.view.expectedState = PersonsView.render(App.state);
        await App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const update = async (params) => {
    if (!params) {
        throw new Error('No params specified');
    }
    const props = copyObject(params);

    let pos;
    if ('id' in props) {
        pos = App.state.persons.getIndexById(props.id);
    } else {
        pos = parseInt(props.pos, 10);
        if (Number.isNaN(pos)) {
            throw new Error('Position of person not specified');
        }
        delete props.pos;
    }

    await test(`Update person [${pos}]`, async () => {
        // Navigate to update person view
        await checkNavigation();
        await App.view.goToUpdatePerson(pos);

        const ids = App.state.getPersonsByIndexes(pos);
        const expectedPerson = App.state.persons.getItem(ids[0]);
        if (!expectedPerson) {
            throw new Error('Can not find specified person');
        }

        // Check initial state of view
        App.view.expectedState = {
            name: {
                value: expectedPerson.name,
                visible: true,
            },
        };
        await App.view.checkState();

        const expPerson = await submitPerson(props);
        if (expPerson) {
            // Check updates in the person tiles
            Object.assign(expectedPerson, props);
            App.state.updatePerson(expectedPerson);
        } else {
            await App.view.cancel();
        }

        App.view.expectedState = PersonsView.render(App.state);
        await App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const del = async (persons) => {
    await test(`Delete persons [${persons.join()}]`, async () => {
        // Navigate to persons list view
        await checkNavigation();
        // Prepare expected state
        const ids = App.state.getPersonsByIndexes(persons);
        App.state.deletePersons(ids);
        // Perform actions on view
        await App.view.deletePersons(persons);

        App.view.expectedState = PersonsView.render(App.state);
        await App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const delFromUpdate = async (pos) => {
    const ind = parseInt(pos, 10);
    if (Number.isNaN(ind) || ind < 0) {
        throw new Error('Position of person not specified');
    }

    await test(`Delete person from update view [${ind}]`, async () => {
        // Navigate to persons list view
        await checkNavigation();
        // Prepare expected state
        const ids = App.state.getPersonsByIndexes(ind);
        App.state.deletePersons(ids);
        // Perform actions on view
        await App.view.goToUpdatePerson(ind);
        await App.view.deleteSelfItem();
        // Check state of persons list view
        App.view.expectedState = PersonsView.render(App.state);
        await App.view.checkState();
        // Check state of main view
        await App.goToMainView();
        App.view.expectedState = MainView.render(App.state);
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
};

export const show = async (persons, val = true) => {
    const itemIds = Array.isArray(persons) ? persons : [persons];

    const actVerb = (val) ? 'Show' : 'Hide';
    await test(`${actVerb} person(s) [${itemIds.join()}]`, async () => {
        // Navigate to persons list view
        await checkNavigation();

        // Check initial state
        await App.state.fetch();
        const ids = App.state.getPersonsByIndexes(itemIds);
        App.state.showPersons(ids, val);
        // Perform actions on view
        await App.view.showPersons(itemIds, val);
        // Check state of persons list view
        App.view.expectedState = PersonsView.render(App.state);
        await App.view.checkState();
        // Check app state
        return App.state.fetchAndTest();
    });
};

export const hide = async (persons) => show(persons, false);

export const toggleSelect = async (persons) => {
    const itemIds = Array.isArray(persons) ? persons : [persons];

    await test(`Toggle select items [${itemIds.join()}]`, async () => {
        // Navigate to persons list view
        await checkNavigation();

        const origItems = App.view.getItems();
        // Check correctness of arguments
        const indexes = [];
        for (const pos of itemIds) {
            const ind = parseInt(pos, 10);
            assert.arrayIndex(origItems, ind);

            indexes.push(ind);
        }

        let expectedItems = origItems.map((item, ind) => {
            const res = copyObject(item);
            if (indexes.includes(ind)) {
                res.isActive = !res.isActive;
            }

            return res;
        });

        await App.view.selectPersons(indexes);
        let items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
        await App.view.selectPersons(indexes);
        items = App.view.getItems();
        assert.deepMeet(items, expectedItems);

        return true;
    });
};

/** Check navigation to update not existing person */
export const securityTests = async () => {
    setBlock('Person security', 2);

    let personId;

    do {
        personId = generateId();
    } while (App.state.persons.getItem(personId) != null);

    const requestURL = `${baseUrl()}persons/update/${personId}`;

    await test('Access to not existing person', async () => {
        await goTo(requestURL);
        if (!(App.view instanceof PersonsView)) {
            throw new Error('Invalid view');
        }

        App.view.expectedState = {
            msgPopup: { success: false, message: 'Fail to update person.' },
        };
        await App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};
