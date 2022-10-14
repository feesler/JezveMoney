import { App } from '../../Application.js';
import { api } from '../../model/api.js';
import { PERSON_HIDDEN } from '../../model/PersonsList.js';

export const createPersons = async () => {
    const personsList = [{
        name: 'Maria',
        flags: 0,
    }, {
        name: 'Ivan<',
        flags: 0,
    }, {
        name: 'Hidden person',
        flags: PERSON_HIDDEN,
    }];

    const createRes = await api.person.createMultiple(personsList);
    [
        App.scenario.MARIA,
        App.scenario.IVAN,
        App.scenario.HIDDEN_PERSON,
    ] = createRes.ids;

    await App.state.fetch();
};
