import 'jezvejs/style';
import {
    show,
    enable,
    insertAfter,
    setEvents,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Spinner } from 'jezvejs/Spinner';
import { createStore } from 'jezvejs/Store';
import { __ } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { View } from '../../utils/View.js';
import { API } from '../../API/index.js';
import { PersonList } from '../../Models/PersonList.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import { InputField } from '../../Components/InputField/InputField.js';
import { actions, reducer } from './reducer.js';
import './PersonView.scss';

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

        App.loadModel(PersonList, 'persons', App.props.persons);

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const isUpdate = this.props.person.id;

        this.loadElementsByIds([
            'heading',
            'personForm',
            'submitBtn',
            'cancelBtn',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('persons.update') : __('persons.create'),
            showInHeaderOnScroll: false,
        });

        setEvents(this.personForm, { submit: (e) => this.onSubmit(e) });

        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'nameInp',
            className: 'form-row',
            name: 'name',
            title: __('persons.name'),
            validate: true,
            onInput: (e) => this.onNameInput(e),
        });
        this.personForm.prepend(this.nameField.elem);

        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        if (isUpdate) {
            this.deleteBtn = Button.create({
                id: 'deleteBtn',
                className: 'warning-btn',
                title: __('actions.delete'),
                icon: 'del',
                onClick: () => this.confirmDelete(),
            });
            this.heading.actionsContainer.append(this.deleteBtn.elem);
        }

        this.subscribeToStore(this.store);
    }

    /** Name input event handler */
    onNameInput(e) {
        const { value } = e.target;
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
            this.store.dispatch(actions.invalidateNameField(__('persons.invalidName')));
            this.nameField.focus();
        } else {
            const person = App.model.persons.findByName(name);
            if (person && state.original.id !== person.id) {
                this.store.dispatch(actions.invalidateNameField(__('persons.existingName')));
                this.nameField.focus();
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

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
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

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
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
            title: __('persons.delete'),
            content: __('persons.deleteMessage'),
            onConfirm: () => this.deletePerson(),
        });
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }

        // Name field
        const isValidName = (state.validation.name === true);
        this.nameField.setState((nameState) => ({
            ...nameState,
            value: state.data.name,
            valid: isValidName,
            feedbackMessage: (isValidName) ? '' : state.validation.name,
            disabled: state.submitStarted,
        }));

        enable(this.submitBtn, !state.submitStarted);
        show(this.cancelBtn, !state.submitStarted);

        this.spinner.show(state.submitStarted);
    }
}

App.createView(PersonView);
