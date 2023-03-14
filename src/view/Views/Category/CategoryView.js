import 'jezvejs/style';
import {
    show,
    enable,
    insertAfter,
    setEvents,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { Button } from 'jezvejs/Button';
import { Spinner } from 'jezvejs/Spinner';
import { __ } from '../../js/utils.js';
import { API } from '../../js/api/index.js';
import { Application } from '../../js/Application.js';
import '../../css/app.scss';
import { View } from '../../js/View.js';
import { Category } from '../../js/model/Category.js';
import { CategoryList } from '../../js/model/CategoryList.js';
import { Heading } from '../../Components/Heading/Heading.js';
import { CategorySelect } from '../../Components/CategorySelect/CategorySelect.js';
import { DeleteCategoryDialog } from '../../Components/DeleteCategoryDialog/DeleteCategoryDialog.js';
import { actions, reducer } from './reducer.js';
import { createStore } from '../../js/store.js';
import '../../Components/Field/Field.scss';
import './CategoryView.scss';

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
        const isUpdate = this.props.category.id;

        this.loadElementsByIds([
            'heading',
            'categoryForm',
            'nameInp',
            'nameFeedback',
            'parentCategoryField',
            'submitBtn',
            'cancelBtn',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: (isUpdate) ? __('CATEGORY_UPDATE') : __('CATEGORY_CREATE'),
            showInHeaderOnScroll: false,
        });

        setEvents(this.categoryForm, { submit: (e) => this.onSubmit(e) });
        setEvents(this.nameInp, { input: (e) => this.onNameInput(e) });

        this.createParentCategorySelect();
        this.createTransactionTypeSelect();

        this.spinner = Spinner.create({ className: 'request-spinner' });
        this.spinner.hide();
        insertAfter(this.spinner.elem, this.cancelBtn);

        // Update mode
        if (isUpdate) {
            this.deleteBtn = Button.create({
                id: 'deleteBtn',
                className: 'warning-btn',
                title: __('DELETE'),
                icon: 'del',
                onClick: () => this.confirmDelete(),
            });
            this.heading.actionsContainer.append(this.deleteBtn.elem);
        }

        this.subscribeToStore(this.store);
    }

    /** Creates parent category select */
    createParentCategorySelect() {
        const { original } = this.store.getState();

        this.parentSelect = CategorySelect.create({
            elem: 'parent',
            className: 'dd_fullwidth',
            parentCategorySelect: true,
            exclude: original.id,
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onItemSelect: (o) => this.onParentSelect(o),
        });
    }

    /** Creates transaction type select */
    createTransactionTypeSelect() {
        const data = Category.getAvailTypes().map((id) => ({
            id,
            title: Category.getTypeTitle(id),
        }));

        this.typeSelect = DropDown.create({
            elem: 'type',
            onItemSelect: (type) => this.onTypeSelect(type),
            className: 'dd_fullwidth',
            data,
        });
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
            window.app.createErrorNotification(e.message);
        }
    }

    async deleteCategory(removeChild = true) {
        const { submitStarted, original } = this.store.getState();
        if (submitStarted || !original.id) {
            return;
        }

        this.startSubmit();

        try {
            await API.category.del({ id: original.id, removeChild });

            window.app.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            window.app.createErrorNotification(e.message);
        }
    }

    /** Show person delete confirmation popup */
    confirmDelete() {
        const { data } = this.store.getState();
        if (!data.id) {
            return;
        }

        DeleteCategoryDialog.create({
            id: 'delete_warning',
            title: __('CATEGORY_DELETE'),
            content: __('MSG_CATEGORY_DELETE'),
            showChildrenCheckbox: (data.parent_id === 0),
            onConfirm: (opt) => this.deleteCategory(opt),
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
