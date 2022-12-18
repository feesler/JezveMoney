import 'jezvejs/style';
import {
    ge,
    show,
    enable,
    insertAfter,
    setEvents,
} from 'jezvejs';
import { IconButton } from 'jezvejs/IconButton';
import { Spinner } from 'jezvejs/Spinner';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { PersonList } from '../../js/model/PersonList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../Components/Heading/style.scss';
import './style.scss';
import { actions, reducer } from './reducer.js';
import { createStore } from '../../js/store.js';

const TITLE_PERSON_DELETE = 'Delete person';
const MSG_PERSON_DELETE = 'Are you sure want to delete selected person?<br>Debt operations will be converted into expense or income.';
const MSG_EMPTY_NAME = 'Input name.';
const MSG_EXISTING_NAME = 'Person with this name already exist.';

/**
 * Create/update person view
 */
class PersonView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
            validation: {
                name: true,
                valid: true,
            },
            submitStarted: false,
        };

        if (this.props.person) {
            initialState.original = this.props.person;
            initialState.data = { ...initialState.original };
        }

        window.app.loadModel(PersonList, 'persons', window.app.props.persons);

        this.store = createStore(reducer, initialState);
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'personForm',
            'nameInp',
            'nameFeedback',
            'submitBtn',
            'cancelBtn',
        ]);

        setEvents(this.personForm, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.spinner = Spinner.create();
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        const deleteBtn = ge('deleteBtn');
        if (deleteBtn) {
            this.deleteBtn = IconButton.fromElement(deleteBtn, {
                onClick: () => this.confirmDelete(),
            });
        }

        this.subscribeToStore(this.store);
    }

    /** Name input event handler */
    onNameInput() {
        const { value } = this.nameInp;
        this.store.dispatch(actions.changeName(value));
    }

    /** Form submit event handler */
    onSubmit(e) {
        e.preventDefault();

        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        const { name } = state.data;
        if (name.length === 0) {
            this.store.dispatch(actions.invalidateNameField(MSG_EMPTY_NAME));
            this.nameInp.focus();
        } else {
            const person = window.app.model.persons.findByName(name);
            if (person && state.original.id !== person.id) {
                this.store.dispatch(actions.invalidateNameField(MSG_EXISTING_NAME));
                this.nameInp.focus();
            }
        }

        const { validation } = this.store.getState();
        if (validation.valid) {
            this.submitPerson();
        }
    }

    startSubmit() {
        this.store.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.store.dispatch(actions.cancelSubmit());
    }

    async submitPerson() {
        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        this.startSubmit();

        const isUpdate = state.original.id;
        const data = {
            name: state.data.name,
            flags: state.original.flags,
        };

        if (isUpdate) {
            data.id = state.original.id;
        }

        try {
            if (isUpdate) {
                await API.person.update(data);
            } else {
                await API.person.create(data);
            }

            const { baseURL } = window.app;
            window.location = `${baseURL}persons/`;
        } catch (e) {
            this.cancelSubmit();
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    async deletePerson() {
        const { submitStarted, original } = this.store.getState();
        if (submitStarted || !original.id) {
            return;
        }

        this.startSubmit();

        try {
            await API.person.del({ id: original.id });

            const { baseURL } = window.app;
            window.location = `${baseURL}persons/`;
        } catch (e) {
            this.cancelSubmit();
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    /** Show person delete confirmation popup */
    confirmDelete() {
        const { data } = this.store.getState();
        if (!data.id) {
            return;
        }

        ConfirmDialog.create({
            id: 'delete_warning',
            title: TITLE_PERSON_DELETE,
            content: MSG_PERSON_DELETE,
            onconfirm: () => this.deletePerson(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }

        // Name input
        this.nameInp.value = state.data.name;
        window.app.setValidation('name-inp-block', (state.validation.name === true));
        this.nameFeedback.textContent = (state.validation.name === true)
            ? ''
            : state.validation.name;
        enable(this.nameInp, !state.submitStarted);

        enable(this.submitBtn, !state.submitStarted);
        show(this.cancelBtn, !state.submitStarted);

        this.spinner.show(state.submitStarted);
    }
}

window.app = new Application(window.appProps);
window.app.createView(PersonView);
