import {
    test,
    copyObject,
    assert,
    setBlock,
    baseUrl,
    goTo,
    asArray,
} from 'jezve-test';
import { generateId } from '../common.js';
import { PersonListView } from '../view/PersonListView.js';
import { PersonView } from '../view/PersonView.js';
import { MainView } from '../view/MainView.js';
import { App } from '../Application.js';
import { __ } from '../model/locale.js';

/** Navigate to persons list page */
const checkNavigation = async () => {
    if (!(App.view instanceof PersonListView)) {
        await App.view.navigateToPersons();
    }
};

/** Navigate to create person view */
export const create = async () => {
    await test('Create person', async () => {
        await checkNavigation();
        await App.view.goToCreatePerson();

        const expectedPerson = {
            name: '',
        };
        App.view.setExpectedPerson(expectedPerson);
        App.view.expectedState = App.view.getExpectedState();
        return App.view.checkState();
    });
};

/** Navigate to update person view */
export const update = async (pos) => {
    const index = parseInt(pos, 10);
    assert(!Number.isNaN(index), 'Position of person not specified');

    await test(`Update person [${index}]`, async () => {
        await checkNavigation();
        await App.view.goToUpdatePerson(index);

        const [expectedPerson] = App.state.getSortedPersonsByIndexes(index);
        assert(expectedPerson, 'Can not find specified person');

        App.view.setExpectedPerson(expectedPerson);
        App.view.expectedState = App.view.getExpectedState();
        return App.view.checkState();
    });
};

export const showDetails = async ({ index, directNavigate = false }) => {
    await App.state.fetch();

    const ind = parseInt(index, 10);
    assert(!Number.isNaN(ind), 'Position of person not specified');

    await test(`Show details of person [${index}]`, async () => {
        await checkNavigation();
        return App.view.showDetails(index, directNavigate);
    });
};

export const closeDetails = async (directNavigate = false) => {
    await test('Close person details', async () => {
        await checkNavigation();
        return App.view.closeDetails(directNavigate);
    });
};

export const inputName = async (value) => {
    await test(`Input name '${value}'`, () => App.view.inputName(value));
};

export const submit = async () => {
    await test('Submit person', async () => {
        assert.instanceOf(App.view, PersonView, 'Invalid view');

        const validInput = App.view.isValid();
        const expectedPerson = (validInput) ? App.view.getExpectedPerson() : null;

        await App.view.submit();

        if (validInput) {
            assert.instanceOf(App.view, PersonListView, 'Fail to submit person');
        }

        if (expectedPerson) {
            if (expectedPerson.id) {
                App.state.updatePerson(expectedPerson);
            } else {
                App.state.createPerson(expectedPerson);
            }
        } else {
            await App.view.cancel();
        }

        App.view.expectedState = PersonListView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const del = async (persons) => {
    await test(`Delete persons [${persons.join()}]`, async () => {
        await checkNavigation();

        const ids = App.state.getSortedPersonsByIndexes(persons, true);
        App.state.deletePersons(ids);

        await App.view.deletePersons(persons);

        App.view.expectedState = PersonListView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const delFromUpdate = async (pos) => {
    const ind = parseInt(pos, 10);
    assert(!Number.isNaN(ind) && ind >= 0, 'Position of person not specified');

    await test(`Delete person from update view [${ind}]`, async () => {
        await checkNavigation();

        await App.view.goToUpdatePerson(ind);
        await App.view.deleteSelfItem();

        const ids = App.state.getSortedPersonsByIndexes(ind, true);
        App.state.deletePersons(ids);

        App.view.expectedState = PersonListView.render(App.state);
        App.view.checkState();

        await App.goToMainView();
        App.view.expectedState = MainView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const show = async (persons, val = true) => {
    const itemIds = asArray(persons);

    const actVerb = (val) ? 'Show' : 'Hide';
    await test(`${actVerb} person(s) [${itemIds.join()}]`, async () => {
        await checkNavigation();

        await App.state.fetch();
        const ids = App.state.getSortedPersonsByIndexes(itemIds, true);
        App.state.showPersons(ids, val);

        await App.view.showPersons(itemIds, val);

        App.view.expectedState = PersonListView.render(App.state);
        App.view.checkState();

        return App.state.fetchAndTest();
    });
};

export const hide = async (persons) => show(persons, false);

export const exportTest = async (persons) => {
    const itemIds = asArray(persons);

    await test(`Export persons [${itemIds.join()}]`, async () => {
        await checkNavigation();

        await App.state.fetch();
        const ids = App.state.getSortedPersonsByIndexes(itemIds, true);
        const transactions = App.state.transactions.applyFilter({ persons: ids });
        const expectedContent = transactions.exportToCSV();

        const content = await App.view.exportPersons(itemIds);

        return assert.deepMeet(content.trim(), expectedContent.trim());
    });
};

export const toggleSelect = async (persons) => {
    const itemIds = asArray(persons);

    await test(`Toggle select items [${itemIds.join()}]`, async () => {
        await checkNavigation();

        const origItems = App.view.getItems();

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

export const selectAll = async () => {
    await test('Select all persons', async () => {
        await checkNavigation();
        return App.view.selectAll();
    });
};

export const deselectAll = async () => {
    await test('Deselect all persons', async () => {
        await checkNavigation();
        return App.view.deselectAll();
    });
};

export const toggleSortByName = async () => {
    await test('Toggle sort by name', async () => {
        await checkNavigation();
        return App.view.toggleSortByName();
    });
};

export const toggleSortByDate = async () => {
    await test('Toggle sort by date', async () => {
        await checkNavigation();
        return App.view.toggleSortByDate();
    });
};

export const sortManually = async () => {
    await test('Sort manually', async () => {
        await checkNavigation();
        await App.view.setSortMode();
        return App.view.setListMode();
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
        assert(!(App.view instanceof PersonView), 'Invalid view');

        App.view.expectedState = {
            notification: { success: false, message: __('ERR_PERSON_UPDATE', App.view.locale) },
        };
        App.view.checkState();
        await App.view.closeNotification();

        return true;
    });
};
