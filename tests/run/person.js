import {
    test,
    setParam,
    copyObject,
    checkObjValue,
} from '../common.js';
import { PersonsView } from '../view/persons.js';
import { PersonView } from '../view/person.js';
import { MainView } from '../view/main.js';
import { App } from '../app.js';

export async function submitPerson(params) {
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
}

/**
 * From persons list view go to new person view, input name and submit
 * Next check name result and callback
 * @param {Object} params
 */
export async function create(params) {
    // Navigate to create person view
    if (!(App.view instanceof PersonsView)) {
        await App.goToMainView();
        await App.view.goToPersons();
    }
    await App.view.goToCreatePerson();

    const expPerson = await submitPerson(params);
    if (expPerson) {
        App.state.createPerson(expPerson);
    } else {
        await App.view.cancel();
    }

    App.view.expectedState = PersonsView.render(App.state);
    await test(`Create person ({ name : ${params.name} })`, () => App.view.checkState());

    await App.state.fetch();
}

export async function update(params) {
    if (!params) {
        throw new Error('No params specified');
    }
    const props = copyObject(params);

    let pos;
    if ('id' in props) {
        pos = App.state.persons.getIndexOf(props.id);
    } else {
        pos = parseInt(props.pos, 10);
        if (Number.isNaN(pos)) {
            throw new Error('Position of person not specified');
        }
        delete props.pos;
    }

    // Navigate to update person view
    if (!(App.view instanceof PersonsView)) {
        await App.goToMainView();
        await App.view.goToPersons();
    }
    await App.view.goToUpdatePerson(pos);

    const ids = App.state.getPersonsByIndexes(pos);
    const expectedPerson = App.state.persons.getItem(ids[0]);
    if (!expectedPerson) {
        throw new Error('Can not find specified person');
    }

    App.view.expectedState = {
        visibility: { name: true },
        values: { name: expectedPerson.name },
    };
    await test('Update person view state', () => App.view.checkState());

    const expPerson = await submitPerson(props);
    if (expPerson) {
        // Check updates in the person tiles
        setParam(expectedPerson, props);
        App.state.updatePerson(expectedPerson);
    } else {
        await App.view.cancel();
    }

    App.view.expectedState = PersonsView.render(App.state);
    await test(`Update person [${pos}]`, () => App.view.checkState());

    await App.state.fetch();
}

export async function del(persons) {
    // Navigate to persons list view
    if (!(App.view instanceof PersonsView)) {
        await App.goToMainView();
        await App.view.goToPersons();
    }

    // Prepare expected updates of persons list
    const ids = App.state.getPersonsByIndexes(persons);
    App.state.deletePersons(ids);

    await App.view.deletePersons(persons);

    App.view.expectedState = PersonsView.render(App.state);
    await test(`Delete persons [${persons.join()}]`, () => App.view.checkState());

    await App.state.fetch();
}

export async function delFromUpdate(pos) {
    const ind = parseInt(pos, 10);
    if (Number.isNaN(ind) || ind < 0) {
        throw new Error('Position of person not specified');
    }

    App.view.setBlock(`Delete person from update view [${ind}]`, 2);

    if (!(App.view instanceof PersonsView)) {
        if (!(App.view instanceof MainView)) {
            await App.goToMainView();
        }
        await App.view.goToPersons();
    }

    const ids = App.state.getPersonsByIndexes(ind);
    App.state.deletePersons(ids);

    await App.view.goToUpdatePerson(ind);
    await App.view.deleteSelfItem();

    App.view.expectedState = PersonsView.render(App.state);
    await test(`Delete person [${ind}]`, () => App.view.checkState());

    await App.goToMainView();

    App.view.expectedState = MainView.render(App.state);
    await test('Main page widgets update', () => App.view.checkState());
    await test('App state', () => App.state.fetchAndTest());
}

export async function show(persons, val = true) {
    const itemIds = Array.isArray(persons) ? persons : [persons];

    const showVerb = (val) ? 'Show' : 'Hide';
    App.view.setBlock(`${showVerb} person(s) [${itemIds.join()}]`, 2);

    // Navigate to create persons view
    if (!(App.view instanceof PersonsView)) {
        await App.goToMainView();
        await App.view.goToPersons();
    }

    // Check initial state
    await App.state.fetch();
    const ids = App.state.getPersonsByIndexes(itemIds);
    App.state.showPersons(ids, val);

    await App.view.showPersons(itemIds, val);

    App.view.expectedState = PersonsView.render(App.state);

    await test(`${showVerb} persons [${itemIds.join()}]`, () => App.view.checkState());
    await test('App state', () => App.state.fetchAndTest());
}

export async function hide(persons) {
    return show(persons, false);
}

export async function toggleSelect(persons) {
    const itemIds = Array.isArray(persons) ? persons : [persons];

    await test(`Toggle select items [${itemIds.join()}]`, async () => {
        const origItems = App.view.getItems();
        // Check correctness of arguments
        const indexes = [];
        for (const pos of itemIds) {
            const ind = parseInt(pos, 10);
            if (Number.isNaN(ind) || ind < 0 || ind > origItems.length) {
                throw new Error(`Invalid item index ${pos}`);
            }
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
        checkObjValue(items, expectedItems);

        // Click by items again to inverse selection
        expectedItems = origItems;
        await App.view.selectPersons(indexes);
        items = App.view.getItems();
        checkObjValue(items, expectedItems);

        return true;
    });
}
