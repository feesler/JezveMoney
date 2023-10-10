import 'jezvejs/style';
import {
    show,
    setEvents,
    insertBefore,
} from 'jezvejs';
import { DropDown } from 'jezvejs/DropDown';
import { Button } from 'jezvejs/Button';
import { createStore } from 'jezvejs/Store';

import { __ } from '../../utils/utils.js';
import { API } from '../../API/index.js';
import { App } from '../../Application/App.js';
import '../../Application/Application.scss';
import { AppView } from '../../Components/Layout/AppView/AppView.js';

import { Category } from '../../Models/Category.js';
import { CategoryList } from '../../Models/CategoryList.js';
import { Transaction } from '../../Models/Transaction.js';

import { Heading } from '../../Components/Layout/Heading/Heading.js';
import { CategorySelect } from '../../Components/Category/CategorySelect/CategorySelect.js';
import { ColorField } from '../../Components/Form/Fields/ColorField/ColorField.js';
import { InputField } from '../../Components/Form/Fields/InputField/InputField.js';
import { DeleteCategoryDialog } from '../../Components/Category/DeleteCategoryDialog/DeleteCategoryDialog.js';
import { FormControls } from '../../Components/Form/FormControls/FormControls.js';

import { actions, reducer } from './reducer.js';
import './CategoryView.scss';

/**
 * Create/update category view
 */
class CategoryView extends AppView {
    constructor(...args) {
        super(...args);

        const initialState = {
            validation: {
                name: true,
                color: true,
                valid: true,
            },
            submitStarted: false,
        };

        if (this.props.category) {
            initialState.original = this.props.category;
            initialState.data = { ...initialState.original };
        }

        App.loadModel(CategoryList, 'categories', App.props.categories);
        App.initCategoriesModel();

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
            'parentCategoryField',
            'typeField',
        ]);

        this.heading = Heading.fromElement(this.heading, {
            title: this.getHeaderTitle(isUpdate),
            showInHeaderOnScroll: false,
        });

        setEvents(this.categoryForm, { submit: (e) => this.onSubmit(e) });

        // Name field
        this.nameField = InputField.create({
            id: 'nameField',
            inputId: 'nameInp',
            className: 'form-row',
            name: 'name',
            title: __('categories.name'),
            validate: true,
            onInput: (e) => this.onNameInput(e),
        });
        insertBefore(this.nameField.elem, this.typeField);

        this.createParentCategorySelect();
        this.createTransactionTypeSelect();

        // Color field
        this.colorField = ColorField.create({
            id: 'colorField',
            inputId: 'colorInp',
            type: 'color',
            name: 'color',
            className: 'form-row',
            title: __('categories.color'),
            validate: true,
            feedbackMessage: __('categories.existingColor'),
            disableAutoProps: false,
            onInput: (e) => this.onColorInput(e),
        });
        this.nameField.elem.after(this.colorField.elem);

        // Controls
        this.submitControls = FormControls.create({
            id: 'submitControls',
            submitTitle: __('actions.submit'),
            cancelTitle: __('actions.cancel'),
            cancelURL: App.props.nextAddress,
        });
        this.categoryForm.append(this.submitControls.elem);

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

    getHeaderTitle(isUpdate) {
        return (isUpdate) ? __('categories.update') : __('categories.create');
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
            noResultsMessage: __('notFound'),
            onItemSelect: (o) => this.onParentSelect(o),
        });
        this.parentSelect.setSelection(original.parent_id);
    }

    /** Creates transaction type select */
    createTransactionTypeSelect() {
        const { original } = this.store.getState();

        const data = Category.getAvailTypes().map((id) => ({
            id,
            title: Category.getTypeTitle(id),
            selected: original.type === id,
        }));

        this.typeSelect = DropDown.create({
            elem: 'type',
            onItemSelect: (type) => this.onTypeSelect(type),
            className: 'dd_fullwidth',
            data,
        });
    }

    /** Name input event handler */
    onNameInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changeName(value));
    }

    /** Color input event handler */
    onColorInput(e) {
        const { value } = e.target;
        this.store.dispatch(actions.changeColor(value));
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

        const { name, color } = state.data;

        if (name.length === 0) {
            this.store.dispatch(actions.invalidateNameField(__('categories.invalidName')));
            this.nameField.focus();
        } else {
            const category = App.model.categories.findByName(name);
            if (category && state.original.id !== category.id) {
                this.store.dispatch(actions.invalidateNameField(__('categories.existingName')));
                this.nameField.focus();
            }
        }

        const colorItems = App.model.categories.findByColor(color);
        if (
            colorItems?.length > 0
            && state.original.id !== colorItems[0].id
        ) {
            this.store.dispatch(actions.invalidateColorField());
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
            color: state.data.color,
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

            App.navigateNext();
        } catch (e) {
            this.cancelSubmit();
            App.createErrorNotification(e.message);
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

        DeleteCategoryDialog.create({
            id: 'delete_warning',
            title: __('categories.delete'),
            content: __('categories.deleteMessage'),
            showChildrenCheckbox: (data.parent_id === 0),
            onConfirm: (opt) => this.deleteCategory(opt),
        });
    }

    replaceHistory(state) {
        const { baseURL } = App;
        const { data } = state;
        const isUpdate = state.original.id;
        const baseAddress = (isUpdate)
            ? `${baseURL}categories/update/${data.id}`
            : `${baseURL}categories/create/`;

        const url = new URL(baseAddress);

        if (data.type !== 0) {
            const typeStr = Transaction.getTypeString(data.type);
            url.searchParams.set('type', typeStr);
        }

        if (data.parent_id !== 0) {
            url.searchParams.set('parent_id', data.parent_id);
        }

        const title = `${__('appName')} | ${this.getHeaderTitle(isUpdate)}`;

        window.history.replaceState({}, title, url);
    }

    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.replaceHistory(state);

        if (this.deleteBtn) {
            this.deleteBtn.enable(!state.submitStarted);
        }

        const parentId = parseInt(state.data.parent_id, 10);

        // Name field
        const isValidName = (state.validation.name === true);
        this.nameField.setState((nameState) => ({
            ...nameState,
            value: state.data.name,
            valid: isValidName,
            feedbackMessage: (isValidName) ? '' : state.validation.name,
            disabled: state.submitStarted,
        }));

        // Color field
        this.colorField.setState((colorState) => ({
            ...colorState,
            value: state.data.color,
            valid: state.validation.color,
            disabled: (state.submitStarted || parentId !== 0),
        }));

        // Parent category field
        const { categories } = App.model;
        const isUpdate = state.original.id;
        const minItems = (isUpdate) ? 1 : 0;

        show(this.parentCategoryField, categories.length > minItems);
        this.parentSelect.setSelection(state.data.parent_id);
        this.parentSelect.enable(!state.submitStarted);

        // Transaction type field
        this.typeSelect.setSelection(state.data.type);
        this.typeSelect.enable(!state.submitStarted && parentId === 0);

        // Controls
        if (state.submitStarted !== prevState?.submitStarted) {
            this.submitControls.setLoading(state.submitStarted);
        }
    }
}

App.createView(CategoryView);
