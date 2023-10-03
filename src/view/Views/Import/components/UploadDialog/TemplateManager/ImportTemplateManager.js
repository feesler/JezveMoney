import {
    ge,
    isFunction,
    show,
    enable,
    Component,
    setEvents,
    insertAfter,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { DropDown } from 'jezvejs/DropDown';

import { __ } from '../../../../../utils/utils.js';
import { App } from '../../../../../Application/App.js';
import { API } from '../../../../../API/index.js';
import { ImportTemplateError } from '../../../../../Models/Error/ImportTemplateError.js';
import { IMPORT_DATE_LOCALE, ImportTemplate } from '../../../../../Models/ImportTemplate.js';
import { ConfirmDialog } from '../../../../../Components/Common/ConfirmDialog/ConfirmDialog.js';
import { LoadingIndicator } from '../../../../../Components/Common/LoadingIndicator/LoadingIndicator.js';
import { ImportTemplateForm } from '../TemplateForm/ImportTemplateForm.js';
import { TemplateSelect } from '../TemplateSelect/TemplateSelect.js';
import './ImportTemplateManager.scss';

/** CSS classes */
const VALID_FEEDBACK_CLASS = 'valid-feedback';
const INVALID_FEEDBACK_CLASS = 'invalid-feedback';

/** States */
export const LOADING_STATE = 1;
export const TPL_SELECT_STATE = 2;
export const TPL_CREATE_STATE = 3;
export const TPL_UPDATE_STATE = 4;

const defaultValidation = {
    name: true,
    firstRow: true,
    valid: true,
    columns: true,
};

/**
 * ImportTemplateManager component
 */
export class ImportTemplateManager extends Component {
    constructor(...args) {
        super(...args);

        if (!this.props?.mainAccount) {
            throw new Error('Failed to initialize upload file dialog');
        }

        this.state = {
            visible: false,
            mainAccount: this.props.mainAccount,
            templates: App.model.templates.data,
            listLoading: false,
            formRequest: null,
            template: null,
            selectedTemplateId: 0,
            validation: {
                ...defaultValidation,
            },
        };

        this.init();
    }

    init() {
        const elemIds = [
            'tplSelectGroup',
            'tplFilename',
            'tplField',
            'tplFieldHeader',
            'tplFeedback',
            'columnField',
            'initialAccField',
            'uploadControls',
            'submitUploadedBtn',
            'convertFeedback',
        ];
        elemIds.forEach((id) => {
            this[id] = ge(id);
            if (!this[id]) {
                throw new Error('Failed to initialize upload file dialog');
            }
        });

        this.templateSelect = TemplateSelect.create({
            onChange: (tpl) => this.onTemplateChange(tpl),
            onUpdate: () => this.onUpdateTemplate(),
            onDelete: () => this.onDeleteTemplate(),
        });
        insertAfter(this.templateSelect.elem, this.tplFieldHeader);

        this.createTplBtn = Button.create({
            id: 'createTplBtn',
            className: 'create-btn circle-btn',
            icon: 'plus',
            onClick: () => this.onCreateTemplateClick(),
        });
        this.tplFieldHeader.append(this.createTplBtn.elem);

        // Template form
        this.templateForm = ImportTemplateForm.create({
            mainAccount: this.state.mainAccount,
            rawData: this.state.rawData,
            template: this.state.template,
            listLoading: this.state.listLoading,
            onSubmit: (request) => this.onSubmitTemplate(request),
            onCancel: () => this.onCancelTemplate(),
        });

        // Main account
        this.accountDropDown = DropDown.create({
            elem: 'initialAccount',
            enableFilter: true,
            noResultsMessage: __('notFound'),
            onChange: (account) => this.onAccountChange(account),
        });
        App.initAccountsList(this.accountDropDown);
        this.accountDropDown.setSelection(this.state.mainAccount.id);

        setEvents(this.submitUploadedBtn, { click: () => this.onSubmit() });

        this.loadingIndicator = LoadingIndicator.create({ fixed: false });
        this.elem.append(this.loadingIndicator.elem);

        this.reset();
    }

    show(visible = true) {
        this.setState({ ...this.state, visible });
    }

    hide() {
        this.show(false);
    }

    onSubmit() {
        if (isFunction(this.props.onSubmit)) {
            this.props.onSubmit();
        }
    }

    /** Apply currently selected template to raw data and return array of import data items */
    applyTemplate() {
        if (
            !this.state
            || !Array.isArray(this.state.rawData)
            || !this.state.template
        ) {
            throw new Error('Invalid state');
        }

        try {
            const res = this.state.template.applyTo(this.state.rawData, this.state.mainAccount);
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
        this.setState({
            ...this.state,
            id: LOADING_STATE,
            visible: false,
            rawData: null,
            filename: null,
            rowsToShow: 3,
            listLoading: false,
            formRequest: null,
            template: null,
            selectedTemplateId: 0,
        });
    }

    /** Show/hide loading indication */
    setLoading() {
        this.setState({ ...this.state, id: LOADING_STATE });
    }

    /** Copy specified data to component */
    setRawData(data, filename) {
        this.setState({
            ...this.state,
            rawData: structuredClone(data),
            filename,
        });

        if (App.model.templates.length === 0) {
            this.setCreateTemplateState();
            return;
        }

        let template = this.findValidTemplate(this.state.rawData);
        if (!template) {
            [template] = this.state.templates;
            if (!template) {
                throw new Error('Invalid selection');
            }
        }

        this.setTemplate(template.id);
        this.setState({
            ...this.state,
            selectedTemplateId: template.id,
        });
        this.setSelectTemplateState();
    }

    /** Main account update handler */
    setMainAccount(mainAccount) {
        if (!mainAccount) {
            throw new Error('Invalid account');
        }

        this.setState({
            ...this.state,
            mainAccount,
        });
    }

    /** Initial account select 'change' event handler */
    onAccountChange(selectedAccount) {
        return this.changeMainAccount(selectedAccount?.id);
    }

    changeMainAccount(id) {
        if (this.state.mainAccount.id === id) {
            return;
        }
        const mainAccount = App.model.accounts.getItem(id);
        if (!mainAccount) {
            throw new Error('Account not found');
        }

        this.setState({
            ...this.state,
            mainAccount,
        });

        if (isFunction(this.props.onAccountChange)) {
            this.props.onAccountChange(mainAccount.id);
        }
    }

    /** Import template select 'change' event handler */
    onTemplateChange(selectedTemplate) {
        if (this.state.id !== TPL_SELECT_STATE) {
            return;
        }

        if (!selectedTemplate) {
            throw new Error('Invalid selection');
        }

        this.setTemplate(selectedTemplate.id);

        this.setState({
            ...this.state,
            selectedTemplateId: selectedTemplate.id,
        });
    }

    /**
     * Set specified template
     * @param {number} value - import template id
     */
    setTemplate(value) {
        const template = App.model.templates.getItem(value) ?? null;

        if (template?.account_id) {
            this.changeMainAccount(template.account_id);
        }

        this.validateTemplateAndSetState({
            ...this.state,
            template,
        });
    }

    /** Create template button 'click' event handler */
    onCreateTemplateClick() {
        this.setCreateTemplateState();
    }

    /** Set select template state */
    setSelectTemplateState() {
        this.setState({
            ...this.state,
            id: TPL_SELECT_STATE,
        });
        this.notifyStateChanged();
    }

    /** Set create template state */
    setCreateTemplateState() {
        this.setState({
            ...this.state,
            id: TPL_CREATE_STATE,
            template: new ImportTemplate({
                name: '',
                type_id: 0,
                account_id: 0,
                first_row: 2,
                date_locale: IMPORT_DATE_LOCALE,
                columns: {},
            }),
            validation: {
                ...defaultValidation,
            },
        });

        this.templateForm.validateTemplateAndSetState();
        this.notifyStateChanged();
    }

    /** Update template button 'click' event handler */
    onUpdateTemplate() {
        this.setState({
            ...this.state,
            id: TPL_UPDATE_STATE,
        });
        this.templateForm.validateTemplateAndSetState();
        this.notifyStateChanged();
    }

    /** Notifyes template form state changed */
    notifyStateChanged() {
        if (!isFunction(this.props.onChangeState)) {
            return;
        }

        this.props.onChangeState(this.state.id);
    }

    /** Delete template button 'click' event handler */
    onDeleteTemplate() {
        ConfirmDialog.create({
            id: 'tpl_delete_warning',
            title: __('import.templates.delete'),
            content: __('import.templates.deleteMessage'),
            onConfirm: () => this.requestDeleteTemplate(this.state.template.id),
        });
    }

    /** Save template button 'click' event handler */
    onSubmitTemplate(request) {
        this.requestSubmitTemplate(request);
    }

    startListLoading(formRequest = null) {
        this.setState({
            ...this.state,
            listLoading: true,
            formRequest,
        });
    }

    stopListLoading() {
        this.setState({
            ...this.state,
            listLoading: false,
            formRequest: null,
        });
    }

    prepareRequest(data) {
        return {
            ...data,
            returnState: {
                importtemplates: {},
                importrules: {},
            },
        };
    }

    getListDataFromResponse(response) {
        const state = response?.data?.state;
        return {
            templates: state?.importtemplates?.data,
            rules: state?.importrules?.data,
        };
    }

    setListData(templatesData, rulesData) {
        const { templates } = App.model;
        templates.setData(templatesData);
        this.setState({
            ...this.state,
            templates: templates.data,
        });

        if (App.model.templates.length > 0) {
            // Find template with same name as currently selected
            let template = null;
            if (this.state.formRequest) {
                template = templates.find((item) => item.name === this.state.formRequest.name);
            } else if (this.state.selectedTemplateId) {
                template = templates.getItem(this.state.selectedTemplateId);
            }
            if (!template) {
                template = templates.getItemByIndex(0);
            }
            this.setTemplate(template.id);
            this.setState({
                ...this.state,
                selectedTemplateId: template.id,
            });
            this.setSelectTemplateState();
        } else {
            this.setCreateTemplateState();
        }

        if (rulesData) {
            App.model.rules.setData(rulesData);
        }

        this.stopListLoading();

        if (isFunction(this.props.onUpdate)) {
            this.props.onUpdate();
        }
    }

    /** Send API request to create/update template */
    async requestSubmitTemplate(data) {
        this.startListLoading(data);

        try {
            const request = this.prepareRequest(data);
            const response = (data.id)
                ? await API.importTemplate.update(request)
                : await API.importTemplate.create(request);

            const { templates, rules } = this.getListDataFromResponse(response);
            this.setListData(templates, rules);
        } catch (e) {
            App.createErrorNotification(e.message);
        }
    }

    /** Send API request to delete template */
    async requestDeleteTemplate(id) {
        this.startListLoading();

        try {
            const request = this.prepareRequest({ id });
            const response = await API.importTemplate.del(request);
            const { templates, rules } = this.getListDataFromResponse(response);
            this.setListData(templates, rules);
        } catch (e) {
            App.createErrorNotification(e.message);
            this.stopListLoading();
        }
    }

    /** Cancel template button 'click' event handler */
    onCancelTemplate() {
        if (this.state.id !== TPL_CREATE_STATE && this.state.id !== TPL_UPDATE_STATE) {
            return;
        }

        this.setSelectTemplateState();
        // Restore previously selected template
        this.setTemplate(this.state.selectedTemplateId);
    }

    validateTemplateAndSetState(state) {
        const validation = this.validateTemplate(state.template, state.rawData);
        const newState = {
            ...state,
            validation: {
                ...state.validation,
                ...validation,
            },
        };

        if (!validation.valid && typeof validation.column === 'string') {
            newState.selectedColumn = validation.column;
        }

        this.setState(newState);
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

    /** Validate current template on raw data */
    validateTemplate(template, rawData) {
        if (!template) {
            throw new Error('Invalid template');
        }
        if (!Array.isArray(rawData)) {
            throw new Error('Invalid data');
        }

        const [data] = rawData.slice(1, 2);
        // Account amount
        let value = template.getProperty('accountAmount', data, true);
        if (!value) {
            return { valid: false, column: 'accountAmount' };
        }
        // Transaction amount
        value = template.getProperty('transactionAmount', data, true);
        if (!value) {
            return { valid: false, column: 'transactionAmount' };
        }
        // Account currency
        value = template.getProperty('accountCurrency', data, true);
        let currency = App.model.currency.findByCode(value);
        if (!currency) {
            return { valid: false, column: 'accountCurrency' };
        }
        // Transaction currency
        value = template.getProperty('transactionCurrency', data, true);
        currency = App.model.currency.findByCode(value);
        if (!currency) {
            return { valid: false, column: 'transactionCurrency' };
        }
        // Date
        value = template.getProperty('date', data, true);
        if (!value) {
            return { valid: false, column: 'date' };
        }
        // Comment
        value = template.getProperty('comment', data, true);
        if (!value) {
            return { valid: false, column: 'comment' };
        }

        return { valid: true, column: true };
    }

    /** Find valid template for data */
    findValidTemplate(rawData) {
        return App.model.templates.find((template) => {
            const { valid } = this.validateTemplate(template, rawData);
            return valid;
        });
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

    /** Render component */
    render(state, prevState = {}) {
        const templateAvail = (App.model.templates.length > 0);
        const isLoadingState = (state.id === LOADING_STATE);
        const isSelectState = (state.id === TPL_SELECT_STATE);
        const isFormState = (state.id === TPL_CREATE_STATE || state.id === TPL_UPDATE_STATE);

        show(this.elem, state.visible);

        this.renderTemplateSelect(state, prevState);

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
        show(this.initialAccField, uploadEnabled);
        enable(this.submitUploadedBtn, uploadEnabled);
        show(this.uploadControls, uploadEnabled);
    }
}
