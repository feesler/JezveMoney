import 'jezvejs/style';
import {
    ge,
    show,
    enable,
    insertAfter,
    setEvents,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { IconButton } from 'jezvejs/IconButton';
import { Spinner } from 'jezvejs/Spinner';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { API } from '../../js/api/index.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { ConfirmDialog } from '../../Components/ConfirmDialog/ConfirmDialog.js';
import '../../Components/Heading/style.scss';
import './style.scss';
import { actions, reducer } from './reducer.js';
import { createStore } from '../../js/store.js';
import {
    DEBT,
    EXPENSE,
    INCOME,
    TRANSFER,
} from '../../js/model/Transaction.js';
import { __ } from '../../js/utils.js';

/**
 * Create/update category view
 */
class CategoryView extends View {
    constructor(...args) {
        super(...args);

        const initialState = {
            validation: {
                name: true,
                valid: true,
            },
            submitStarted: false,
        };

        if (this.props.category) {
            initialState.original = this.props.category;
            initialState.data = { ...initialState.original };
        }

        window.app.loadModel(CategoryList, 'categories', window.app.props.categories);

        this.store = createStore(reducer, { initialState });
    }

    /**
     * View initialization
     */
    onStart() {
        this.loadElementsByIds([
            'categoryForm',
            'nameInp',
            'nameFeedback',
            'parentCategoryField',
            'submitBtn',
            'cancelBtn',
        ]);

        setEvents(this.categoryForm, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.createParentCategorySelect();
        this.createTransactionTypeSelect();

        this.spinner = Spinner.create();
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        const deleteBtn = ge('deleteBtn');
        if (deleteBtn) {
            this.deleteBtn = IconButton.fromElement('deleteBtn', {
                onClick: () => this.confirmDelete(),
            });
        }

        this.subscribeToStore(this.store);
    }

    /** Creates parent category select */
    createParentCategorySelect() {
        this.parentSelect = DropDown.create({
            elem: 'parent',
            onItemSelect: (o) => this.onParentSelect(o),
            className: 'dd_fullwidth',
        });
        this.parentSelect.addItem({
            id: 0, title: __('CATEGORY_NO_PARENT'),
        });

        const { categories } = window.app.model;
        const mainCategories = categories.findByParent(0)
            .map(({ id, name }) => ({ id, title: name }));
        this.parentSelect.append(mainCategories);
    }

    /** Creates transaction type select */
    createTransactionTypeSelect() {
        this.typeSelect = DropDown.create({
            elem: 'type',
            onItemSelect: (type) => this.onTypeSelect(type),
            className: 'dd_fullwidth',
        });
        this.typeSelect.append([
            { id: 0, title: __('TR_ANY') },
            { id: EXPENSE, title: __('TR_EXPENSE') },
            { id: INCOME, title: __('TR_INCOME') },
            { id: TRANSFER, title: __('TR_TRANSFER') },
            { id: DEBT, title: __('TR_DEBT') },
        ]);
    }

    /** Name input event handler */
    onNameInput() {
        const { value } = this.nameInp;
        this.store.dispatch(actions.changeName(value));
    }

    /** Parent category select event handler */
    onParentSelect(category) {
        if (!category) {
            return;
        }

        this.store.dispatch(actions.changeParent(category.id));
    }

    /** Type select event handler */
    onTypeSelect(type) {
        if (!type) {
            return;
        }

        this.store.dispatch(actions.changeType(type.id));
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
            this.store.dispatch(actions.invalidateNameField(__('CATEGORY_INVALID_NAME')));
            this.nameInp.focus();
        } else {
            const category = window.app.model.categories.findByName(name);
            if (category && state.original.id !== category.id) {
                this.store.dispatch(actions.invalidateNameField(__('CATEGORY_EXISTING_NAME')));
                this.nameInp.focus();
            }
        }

        const { validation } = this.store.getState();
        if (validation.valid) {
            this.submitCategory();
        }
    }

    startSubmit() {
        this.store.dispatch(actions.startSubmit());
    }

    cancelSubmit() {
        this.store.dispatch(actions.cancelSubmit());
    }

    async submitCategory() {
        const state = this.store.getState();
        if (state.submitStarted) {
            return;
        }

        this.startSubmit();

        const isUpdate = state.original.id;
        const data = {
            name: state.data.name,
            parent_id: state.data.parent_id,
            type: state.data.type,
        };

        if (isUpdate) {
            data.id = state.original.id;
        }

        try {
            if (isUpdate) {
                await API.category.update(data);
            } else {
                await API.category.create(data);
            }

            window.app.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            window.app.createMessage(e.message, 'msg_error');
        }
    }

    async deleteCategory() {
        const { submitStarted, original } = this.store.getState();
        if (submitStarted || !original.id) {
            return;
        }

        this.startSubmit();

        try {
            await API.category.del({ id: original.id });

            window.app.navigateNext();
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
            title: __('CATEGORY_DELETE'),
            content: __('MSG_CATEGORY_DELETE'),
            onConfirm: () => this.deleteCategory(),
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
        window.app.setValidation('name-inp-block', (state.validation.name === true));
        this.nameFeedback.textContent = (state.validation.name === true)
            ? ''
            : state.validation.name;
        this.nameInp.value = state.data.name;
        enable(this.nameInp, !state.submitStarted);

        // Parent category field
        const { categories } = window.app.model;
        const isUpdate = state.original.id;
        const minItems = (isUpdate) ? 1 : 0;

        show(this.parentCategoryField, categories.length > minItems);
        this.parentSelect.setSelection(state.data.parent_id);
        this.parentSelect.enable(!state.submitStarted);

        // Transaction type field
        const parentId = parseInt(state.data.parent_id, 10);

        this.typeSelect.setSelection(state.data.type);
        this.typeSelect.enable(!state.submitStarted && parentId === 0);

        enable(this.submitBtn, !state.submitStarted);
        show(this.cancelBtn, !state.submitStarted);

        this.spinner.show(state.submitStarted);
    }
}

window.app = new Application(window.appProps);
window.app.createView(CategoryView);
