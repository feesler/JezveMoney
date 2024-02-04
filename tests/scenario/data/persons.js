import { App } from '../../Application.js';
import { PERSON_HIDDEN } from '../../model/PersonListModel.js';

export const createPersons = async () => {
    const data = {
        MARIA: {
            name: 'Maria',
        },
        IVAN: {
            name: 'Ivan<',
        },
        HIDDEN_PERSON: {
            name: 'Hidden person',
            flags: PERSON_HIDDEN,
        },
    };

    await App.scenario.createMultiple('person', data);
    await App.state.fetch();
};
