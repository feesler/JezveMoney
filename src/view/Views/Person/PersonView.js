import 'jezvejs/style';
import { createElement } from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

// Application
import { __, createHiddenInputs } from '../../utils/utils.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';
import { API } from '../../API/index.js';

// Models
import { PersonListModel } from '../../Models/PersonListModel.js';

// Common components
import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { ConfirmDialog } from '../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { InputField } from '../../Components/Form/Fields/InputField/InputField.js';
import { FormControls } from '../../Components/Form/FormControls/FormControls.js';

import { actions, reducer } from './reducer.js';
import './PersonView.scss';

/**
 * Create/update person view
 */
class PersonView extends AppView {
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

        App.loadModel(PersonListModel, 'persons', App.props.persons);

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        const isUpdate = this.props.person.id;

        this.loadElementsByIds([
            'heading',
            'formContainer',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('persons.update') : __('persons.create'),
            showInHeaderOnScroll: false,
        });

        // Name field
        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'nameInp',
            className: 'form-row',
            name: 'name',
            title: __('persons.name'),
            validate: true,
            onInput: (e) => this.onNameInput(e),
        });

        // Controls
        this.submitControls = FormControls.create({
            id: 'submitControls',
            submitBtn: {
                title: __('actions.submit'),
            },
            cancelBtn: {
                title: __('actions.cancel'),
                url: App.props.nextAddress,
            },
        });

        // Hidden inputs
        const hiddenInputIds = ['flags'];
        if (isUpdate) {
            hiddenInputIds.push('pid');
        }
        const hiddenInputs = createHiddenInputs(hiddenInputIds);
        Object.assign(this, hiddenInputs);

        this.personForm = createElement('form', {
            props: {
                id: 'personForm',
                method: 'post',
            },
            events: {
                submit: (e) => this.onSubmit(e),
            },
            children: [
                this.nameField.elem,
                this.submitControls.elem,
                ...Object.values(hiddenInputs),
            ],
        });
        this.formContainer.append(this.personForm);

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
        this.dispatch(actions.changeName(value));
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
            this.dispatch(actions.invalidateNameField(__('persons.invalidName')));
            this.nameField.focus();
        } else {
            const person = App.model.persons.findByName(name);
            if (person && state.original.id !== person.id) {
                this.dispatch(actions.invalidateNameField(__('persons.existingName')));
                this.nameField.focus();
            }
        }

        const { validation } = this.store.getState();
        if (validation.valid) {
            this.submitPerson();
        }
    }

    startSubmit() {
        this.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.dispatch(actions.cancelSubmit());
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

    render(state, prevState = {}) {
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

        // Controls
        if (state.submitStarted !== prevState?.submitStarted) {
            this.submitControls.setLoading(state.submitStarted);
        }

        // Hidden fields
        this.flags.value = state.original.flags;
        if (state.original.id) {
            this.pid.value = state.original.id;
        }
    }
}

App.createView(PersonView);
