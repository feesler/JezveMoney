import { isFunction } from '@jezvejs/types';
import { Component } from 'jezvejs';
import {
    show,
    enable,
    createElement,
} from '@jezvejs/dom';
import { Button } from 'jezvejs/Button';
import { DropDown } from 'jezvejs/DropDown';
import { createStore } from 'jezvejs/Store';

// Application
import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';

// Models
import { ImportTemplateError } from '../../../../../Models/Error/ImportTemplateError.js';

// Common components
import { ConfirmDialog } from '../../../../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../../../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { Field } from '../../../../../Components/Common/Field/Field.js';
import { FormControls } from '../../../../../Components/Form/FormControls/FormControls.js';

// Locale components
import { ImportTemplateForm } from '../TemplateForm/ImportTemplateForm.js';
import { TemplateSelect } from '../TemplateSelect/TemplateSelect.js';

import {
    reducer,
    actions,
    defaultValidation,
    LOADING_STATE,
    TPL_SELECT_STATE,
    TPL_CREATE_STATE,
    TPL_UPDATE_STATE,
} from './reducer.js';
import {
    cancelTemplate,
    changeMainAccount,
    createTemplate,
    requestDeleteTemplate,
    requestSubmitTemplate,
    setRawData,
    setTemplate,
} from './actions.js';
import './ImportTemplateManager.scss';

/** CSS classes */
const SECTION_CLASS = 'upload-form__converter';
const FILE_NAME_CLASS = 'converter__file';
const CREATE_BTN_CLASS = 'create-btn circle-btn';
const SELECT_GROUP_CLASS = 'converter__select-group';
const TPL_FIELD_CLASS = 'template-field';
const FEEDBACK_CLASS = 'feedback';
const VALID_FEEDBACK_CLASS = 'valid-feedback';
const INVALID_FEEDBACK_CLASS = 'invalid-feedback';

/**
 * ImportTemplateManager component
 */
export class ImportTemplateManager extends Component {
    constructor(props = {}) {
        super(props);

        if (!this.props?.mainAccount) {
            throw new Error('Failed to initialize upload file dialog');
        }

        const initialState = {
            ...this.props,
            visible: false,
            mainAccount: this.props.mainAccount,
            templates: App.model.templates,
            listLoading: false,
            formRequest: null,
            template: null,
            id: LOADING_STATE,
            rawData: null,
            filename: null,
            rowsToShow: 3,
            selectedTemplateId: 0,
            showDeleteConfirmDialog: false,
            validation: {
                ...defaultValidation,
            },
        };

        this.store = createStore(reducer, { initialState });

        this.init();

        this.subscribeToStore(this.store);
    }

    init() {
        // File name element
        this.tplFilename = createElement('div', {
            props: { id: 'tplFilename', className: FILE_NAME_CLASS },
        });

        // Create template button
        this.createTplBtn = Button.create({
            id: 'createTplBtn',
            className: CREATE_BTN_CLASS,
            icon: 'plus',
            onClick: () => this.store.dispatch(createTemplate()),
        });

        // Template select
        this.templateSelect = TemplateSelect.create({
            onChange: (tpl) => this.onTemplateChange(tpl),
            dispatch: (action) => this.store.dispatch(action),
        });

        // Feedback element
        this.tplFeedback = createElement('div', {
            props: { id: 'tplFeedback', className: FEEDBACK_CLASS },
        });
        show(this.tplFeedback, false);

        // Template field
        this.templateField = Field.create({
            id: 'tplField',
            className: TPL_FIELD_CLASS,
            title: [
                createElement('span', { props: { textContent: __('import.templates.title') } }),
                this.createTplBtn.elem,
            ],
            content: [
                this.templateSelect.elem,
                this.tplFeedback,
            ],
        });

        this.tplSelectGroup = createElement('section', {
            props: { id: 'tplSelectGroup', className: SELECT_GROUP_CLASS },
            children: this.templateField.elem,
        });

        // Template form
        this.templateForm = ImportTemplateForm.create({
            mainAccount: this.props.mainAccount,
            rawData: this.props.rawData,
            template: this.props.template,
            listLoading: this.props.listLoading,
            onSubmit: (request) => this.store.dispatch(requestSubmitTemplate(request)),
            onCancel: () => this.store.dispatch(cancelTemplate()),
        });

        // Main account select
        this.accountDropDown = DropDown.create({
            id: 'initialAccount',
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (account) => this.store.dispatch(changeMainAccount(account.id)),
        });
        App.initAccountsList(this.accountDropDown);
        this.accountDropDown.setSelection(this.props.mainAccount.id);

        // Main account field
        this.initialAccField = Field.create({
            id: 'initialAccField',
            title: __('import.mainAccount'),
            content: this.accountDropDown.elem,
        });
        this.initialAccField.hide();

        // Convert feedback element
        this.convertFeedback = createElement('div', {
            props: { id: 'convertFeedback', className: FEEDBACK_CLASS },
        });
        show(this.convertFeedback, false);

        // Controls
        this.controls = FormControls.create({
            id: 'uploadControls',
            submitBtn: {
                id: 'submitUploadedBtn',
                title: __('import.convertDone'),
                onClick: (e) => this.onSubmit(e),
            },
            cancelBtn: false,
        });
        this.controls.hide();

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });

        this.elem = createElement('section', {
            props: { id: 'templateBlock', className: SECTION_CLASS },
            children: [
                this.tplFilename,
                this.tplSelectGroup,
                this.templateForm.elem,
                this.initialAccField.elem,
                this.convertFeedback,
                this.controls.elem,
                this.loadingIndicator.elem,
            ],
        });
        show(this.elem, false);
    }

    show() {
        this.store.dispatch(actions.show());
    }

    hide() {
        this.store.dispatch(actions.hide());
    }

    onSubmit() {
        if (isFunction(this.props.onSubmit)) {
            this.props.onSubmit();
        }
    }

    /** Apply currently selected template to raw data and return array of import data items */
    applyTemplate() {
        const state = this.store.getState();
        if (!Array.isArray(state?.rawData) || !state?.template) {
            throw new Error('Invalid state');
        }

        try {
            const res = state.template.applyTo(state.rawData, state.mainAccount);
            return res;
        } catch (e) {
            if (!(e instanceof ImportTemplateError)) {
                throw e;
            }

            this.setConvertFeedback(e.message, false);

            return null;
        }
    }

    /** Reset component state */
    reset() {
        this.store.dispatch(actions.reset());
    }

    /** Show/hide loading indication */
    setLoading() {
        this.store.dispatch(actions.setLoading());
    }

    /** Copy specified data to component */
    setRawData(data) {
        this.store.dispatch(setRawData(data));
    }

    /** Main account update handler */
    setMainAccount(mainAccount) {
        if (!mainAccount) {
            throw new Error('Invalid account');
        }

        this.store.dispatch(actions.setMainAccount(mainAccount));
    }

    /** Import template select 'change' event handler */
    onTemplateChange(selectedTemplate) {
        if (!selectedTemplate) {
            throw new Error('Invalid selection');
        }

        const state = this.store.getState();
        if (state.id !== TPL_SELECT_STATE) {
            return;
        }

        this.store.dispatch(setTemplate(selectedTemplate.id));
        this.store.dispatch(actions.selectTemplate(selectedTemplate.id));
    }

    startListLoading(formRequest = null) {
        this.store.dispatch(actions.startListLoading(formRequest));
    }

    /** Set feedback for specified element */
    setFeedback(feedbackElem, message = null, isValid = false) {
        const elem = feedbackElem;
        if (!elem) {
            throw new Error('Invalid element');
        }

        if (typeof message !== 'string' || message.length === 0) {
            elem.textContent = '';
            show(elem, false);
            return;
        }

        elem.textContent = message;

        elem.classList.toggle(VALID_FEEDBACK_CLASS, isValid);
        elem.classList.toggle(INVALID_FEEDBACK_CLASS, !isValid);

        show(elem, true);
    }

    /** Renders selected template feedback */
    setTemplateFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFeedback, message, isValid);
        this.setFeedback(this.convertFeedback);
    }

    /** Validate current template on raw data */
    setConvertFeedback(message = null, isValid = false) {
        this.setFeedback(this.tplFeedback);
        this.setFeedback(this.convertFeedback, message, isValid);
    }

    /** Render import template select element according to the data in model */
    renderTemplateSelect(state, prevState) {
        if (
            state.selectedTemplateId === prevState?.selectedTemplateId
            && state.templates === prevState?.templates
        ) {
            return;
        }

        const template = App.model.templates.getItem(state.selectedTemplateId);
        this.templateSelect.setState((tplState) => ({
            ...tplState,
            template,
            templates: state.templates,
        }));
    }

    renderDeleteConfirmDialog(state, prevState) {
        if (state.showDeleteConfirmDialog === prevState.showDeleteConfirmDialog) {
            return;
        }

        if (!state.showDeleteConfirmDialog) {
            return;
        }

        ConfirmDialog.create({
            id: 'tpl_delete_warning',
            title: __('import.templates.delete'),
            content: __('import.templates.deleteMessage'),
            onConfirm: () => this.store.dispatch(requestDeleteTemplate()),
            onReject: () => this.store.dispatch(actions.hideDeleteConfirmDialog()),
        });
    }

    /** Render component */
    render(state, prevState = {}) {
        const templateAvail = (App.model.templates.length > 0);
        const isLoadingState = (state.id === LOADING_STATE);
        const isSelectState = (state.id === TPL_SELECT_STATE);
        const isFormState = (state.id === TPL_CREATE_STATE || state.id === TPL_UPDATE_STATE);

        show(this.elem, state.visible);

        this.renderTemplateSelect(state, prevState);
        this.renderDeleteConfirmDialog(state, prevState);

        if (isLoadingState || isFormState) {
            show(this.convertFeedback, false);
        }

        show(this.tplField, isSelectState && templateAvail);
        this.createTplBtn.show(isSelectState && templateAvail);

        this.loadingIndicator.show(state.visible && isLoadingState);

        show(this.tplSelectGroup, isSelectState);
        this.templateForm.show(isFormState);

        this.templateSelect.enable(!state.listLoading);
        enable(this.tplNameInp, !state.listLoading);
        this.createTplBtn.enable(!state.listLoading);

        this.tplFilename.textContent = state.filename ?? '';

        if (isFormState) {
            this.templateForm.setState((formState) => ({
                ...formState,
                template: state.template,
                rawData: state.rawData,
                mainAccount: state.mainAccount,
                listLoading: state.listLoading,
            }));

            if (state.id !== prevState.id) {
                this.templateForm.validateTemplateAndSetState();
            }
        }

        if (!Array.isArray(state.rawData) || !state.rawData.length) {
            return;
        }

        const { validation } = state;
        if (state.id === LOADING_STATE) {
            this.setTemplateFeedback();
        } else if (state.id === TPL_SELECT_STATE) {
            const message = (validation.valid) ? __('import.templates.valid') : __('import.templates.notMatches');
            this.setTemplateFeedback(message, validation.valid);
        }

        const uploadEnabled = state.id === TPL_SELECT_STATE && validation.valid;
        this.accountDropDown.enable(uploadEnabled);
        this.accountDropDown.setSelection(state.mainAccount.id);
        this.initialAccField.show(uploadEnabled);

        this.controls.setState((controlsState) => ({
            ...controlsState,
            disabled: !uploadEnabled,
        }));
        this.controls.show(uploadEnabled);
    }
}
