import {
    createElement,
    enable,
    isFunction,
    insertAfter,
    checkDate,
    Component,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Collapsible } from 'jezvejs/Collapsible';
import { DateInput } from 'jezvejs/DateInput';
import { DatePicker } from 'jezvejs/DatePicker';
import { DropDown } from 'jezvejs/DropDown';
import { DecimalInput } from 'jezvejs/DecimalInput';
import 'jezvejs/style/Input';
import { InputGroup } from 'jezvejs/InputGroup';
import { Popup } from 'jezvejs/Popup';
import { fixFloat, getCurrencyPrecision, __ } from '../../../../js/utils.js';
import { transTypeMap, typeNames } from '../../../../js/model/ImportTransaction.js';
import { CategorySelect } from '../../../../Components/CategorySelect/CategorySelect.js';
import { Field } from '../../../../Components/Field/Field.js';
import { OriginalImportData } from '../OriginalData/OriginalImportData.js';
import { SimilarTransactionInfo } from '../SimilarTransactionInfo/SimilarTransactionInfo.js';
import { ToggleButton } from '../../../../Components/ToggleButton/ToggleButton.js';
import './ImportTransactionForm.scss';

/** CSS classes */
const POPUP_CLASS = 'import-form-popup';
const CONTAINER_CLASS = 'import-form';
const VALIDATION_CLASS = 'validation-block';
const INV_FEEDBACK_CLASS = 'feedback invalid-feedback';
const IG_INPUT_CLASS = 'input input-group__input';
const IG_BUTTON_CLASS = 'btn input-group__btn';
const IG_BUTTON_TITLE_CLASS = 'input-group__btn-title';
const DEFAULT_INPUT_CLASS = 'stretch-input';
const AMOUNT_INPUT_CLASS = 'right-align-text';
/* Fields */
const TYPE_FIELD_CLASS = 'form-row type-field';
const ACCOUNT_FIELD_CLASS = 'form-row account-field';
const SRC_AMOUNT_FIELD_CLASS = 'form-row amount-field src-amount-field';
const DEST_AMOUNT_FIELD_CLASS = 'form-row amount-field dest-amount-field';
const PERSON_FIELD_CLASS = 'form-row person-field';
const DATE_FIELD_CLASS = 'form-row date-field';
const CATEGORY_FIELD_CLASS = 'form-row category-field';
const COMMENT_FIELD_CLASS = 'form-row comment-field';
/* Form controls */
const FORM_CONTROLS_CLASS = 'form-controls';
const SUBMIT_BUTTON_CLASS = 'btn submit-btn';
const CANCEL_BUTTON_CLASS = 'btn cancel-btn';

const defaultProps = {
    isUpdate: false,
    collapsed: true,
    onSave: null,
    onCancel: null,
};

const defaultValidation = {
    valid: true,
    sourceAmount: true,
    destAmount: true,
    date: true,
};

/**
 * Import transaction form component
 */
export class ImportTransactionForm extends Component {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        if (!this.props?.transaction?.mainAccount) {
            throw new Error('Invalid props');
        }

        this.state = {
            ...this.props,
            validation: {
                ...defaultValidation,
            },
        };

        this.menuEmptyClickHandler = () => this.hideMenu();

        this.init();
    }

    init() {
        const { createContainer } = window.app;

        this.createTypeField();
        this.createAccountField();
        this.createPersonField();
        this.createSourceAmountField();
        this.createDestAmountField();
        this.createDateField();
        this.createCategoryField();
        this.createCommentField();

        // Save button
        this.saveBtn = createElement('button', {
            props: {
                className: SUBMIT_BUTTON_CLASS,
                type: 'submit',
                textContent: __('SAVE'),
            },
        });
        // Cancel button
        this.cancelBtn = createElement('button', {
            props: {
                className: CANCEL_BUTTON_CLASS,
                type: 'button',
                textContent: __('CANCEL'),
            },
            events: { click: () => this.cancel() },
        });

        this.toggleExtBtn = ToggleButton.create({
            onClick: () => this.toggleCollapse(),
        });

        this.formControls = createContainer(FORM_CONTROLS_CLASS, [
            this.saveBtn,
            this.cancelBtn,
            this.toggleExtBtn.elem,
        ]);

        this.initContainer(CONTAINER_CLASS, [
            this.trTypeField.elem,
            this.transferAccountField.elem,
            this.personField.elem,
            this.srcAmountField.elem,
            this.destAmountField.elem,
            this.dateField.elem,
            this.categoryField.elem,
            this.commentField.elem,
            this.formControls,
        ]);

        this.popup = Popup.create({
            id: 'transactionFormPopup',
            content: this.elem,
            closeButton: true,
            onClose: () => this.cancel(),
            className: POPUP_CLASS,
        });

        this.render(this.state);
    }

    /** Create transaction type field */
    createTypeField() {
        const transferDisabled = window.app.model.accounts.length < 2;
        const debtDisabled = !window.app.model.persons.length;
        const typeItems = Object.keys(typeNames).map((id) => ({
            id,
            title: typeNames[id],
            disabled: (
                (id.startsWith('transfer') && transferDisabled)
                || (id.startsWith('debt') && debtDisabled)
            ),
        }));

        this.typeDropDown = DropDown.create({
            data: typeItems,
            onChange: (type) => this.onTrTypeChanged(type),
        });

        this.trTypeField = Field.create({
            title: __('TR_TYPE'),
            content: this.typeDropDown.elem,
            className: TYPE_FIELD_CLASS,
        });
    }

    /** Create destination(second) account field */
    createAccountField() {
        this.transferAccDropDown = DropDown.create({
            disabled: true,
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: (account) => this.onTransferAccountChanged(account),
        });
        window.app.initAccountsList(this.transferAccDropDown);

        this.transferAccountField = Field.create({
            title: __('TR_DEST_ACCOUNT'),
            content: this.transferAccDropDown.elem,
            className: ACCOUNT_FIELD_CLASS,
        });
    }

    /** Create person field */
    createPersonField() {
        this.personDropDown = DropDown.create({
            disabled: true,
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: (person) => this.onPersonChanged(person),
        });
        window.app.initPersonsList(this.personDropDown);

        this.personField = Field.create({
            title: __('TR_PERSON'),
            content: this.personDropDown.elem,
            className: PERSON_FIELD_CLASS,
        });
    }

    /** Returns invalid feedback element with specified message */
    createInvalidFeedback(message) {
        return createElement('div', {
            props: {
                className: INV_FEEDBACK_CLASS,
                textContent: message,
            },
        });
    }

    /** Create source amount field */
    createSourceAmountField() {
        this.srcAmountInp = createElement('input', {
            props: {
                className: `${IG_INPUT_CLASS} ${DEFAULT_INPUT_CLASS} ${AMOUNT_INPUT_CLASS}`,
                type: 'text',
                name: 'src_amount[]',
                disabled: true,
                placeholder: __('TR_AMOUNT'),
                autocomplete: 'off',
            },
        });
        this.srcAmountDecimalInput = DecimalInput.create({
            elem: this.srcAmountInp,
            onInput: () => this.onSrcAmountInput(),
        });

        this.srcCurrencySign = createElement('div', {
            props: { className: IG_BUTTON_TITLE_CLASS },
        });
        this.srcCurrencyBtn = createElement('button', {
            props: {
                type: 'button',
                className: IG_BUTTON_CLASS,
                tabIndex: -1,
            },
            children: this.srcCurrencySign,
        });

        this.srcCurrencyDropDown = DropDown.create({
            elem: this.srcCurrencySign,
            listAttach: true,
            enableFilter: true,
            onChange: (currency) => this.onSrcCurrChanged(currency),
        });
        window.app.initUserCurrencyList(this.srcCurrencyDropDown);

        this.srcAmountGroup = InputGroup.create({
            children: [this.srcAmountInp, this.srcCurrencyBtn],
        });
        const invalidFeedback = this.createInvalidFeedback(__('TR_INVALID_AMOUNT'));

        this.srcAmountField = Field.create({
            title: __('TR_AMOUNT'),
            content: [this.srcAmountGroup.elem, invalidFeedback],
            className: [SRC_AMOUNT_FIELD_CLASS, VALIDATION_CLASS],
        });
    }

    /** Create destination amount field */
    createDestAmountField() {
        this.destAmountInp = createElement('input', {
            props: {
                className: `${IG_INPUT_CLASS} ${DEFAULT_INPUT_CLASS} ${AMOUNT_INPUT_CLASS}`,
                type: 'text',
                name: 'dest_amount[]',
                placeholder: __('TR_DEST_AMOUNT'),
                autocomplete: 'off',
            },
        });
        this.destAmountDecimalInput = DecimalInput.create({
            elem: this.destAmountInp,
            onInput: () => this.onDestAmountInput(),
        });

        this.destCurrencySign = createElement('div', {
            props: { className: IG_BUTTON_TITLE_CLASS },
        });
        this.destCurrencyBtn = createElement('button', {
            props: {
                type: 'button',
                className: IG_BUTTON_CLASS,
                tabIndex: -1,
            },
            children: this.destCurrencySign,
        });

        this.destCurrencyDropDown = DropDown.create({
            elem: this.destCurrencySign,
            listAttach: true,
            enableFilter: true,
            onChange: (currency) => this.onDestCurrChanged(currency),
        });
        window.app.initUserCurrencyList(this.destCurrencyDropDown);

        this.destAmountGroup = InputGroup.create({
            children: [this.destAmountInp, this.destCurrencyBtn],
        });
        const invalidFeedback = this.createInvalidFeedback(__('TR_INVALID_AMOUNT'));

        this.destAmountField = Field.create({
            title: __('TR_DEST_AMOUNT'),
            content: [this.destAmountGroup.elem, invalidFeedback],
            className: [DEST_AMOUNT_FIELD_CLASS, VALIDATION_CLASS],
        });
        this.destAmountField.hide();
    }

    /** Create date field */
    createDateField() {
        this.dateInp = DateInput.create({
            className: [DEFAULT_INPUT_CLASS, IG_INPUT_CLASS],
            name: 'date[]',
            placeholder: __('TR_DATE'),
            locales: window.app.dateFormatLocale,
            onInput: () => this.onDateInput(),
        });

        this.dateBtn = Button.create({
            icon: 'calendar-icon',
            className: IG_BUTTON_CLASS,
            onClick: () => this.showDatePicker(),
        });

        this.dateGroup = InputGroup.create({
            children: [this.dateInp.elem, this.dateBtn.elem],
        });
        const invalidFeedback = this.createInvalidFeedback(__('TR_INVALID_DATE'));

        this.dateField = Field.create({
            title: __('TR_DATE'),
            content: [this.dateGroup.elem, invalidFeedback],
            className: [DATE_FIELD_CLASS, VALIDATION_CLASS],
        });
    }

    createCategoryField() {
        this.categorySelect = CategorySelect.create({
            className: 'dd_fullwidth',
            enableFilter: true,
            noResultsMessage: __('NOT_FOUND'),
            onChange: (category) => this.onCategoryChanged(category),
        });

        this.categoryField = Field.create({
            title: __('TR_CATEGORY'),
            content: this.categorySelect.elem,
            className: CATEGORY_FIELD_CLASS,
        });
    }

    createCommentField() {
        this.commInp = createElement('input', {
            props: {
                className: DEFAULT_INPUT_CLASS,
                type: 'text',
                name: 'comment[]',
                placeholder: __('TR_COMMENT'),
                autocomplete: 'off',
            },
            events: { input: () => this.onCommentInput() },
        });
        this.commentField = Field.create({
            title: __('TR_COMMENT'),
            content: this.commInp,
            className: COMMENT_FIELD_CLASS,
        });
    }

    initContainer(className, children) {
        this.elem = createElement('form', {
            props: { className },
            children,
            events: { submit: (e) => this.onSubmit(e) },
        });
    }

    reset() {
        this.setState({
            ...this.state,
            validation: {
                ...defaultValidation,
            },
            isUpdate: false,
            collapsed: true,
        });
    }

    /** Show/hide dialog */
    show(val) {
        this.popup.show(val);
    }

    /** Hide dialog */
    hide() {
        this.popup.hide();
    }

    /** Toggle collapse/expand button 'click' event handler */
    toggleCollapse() {
        this.setState({
            ...this.state,
            collapsed: !this.state.collapsed,
        });
    }

    /** Transaction type select 'change' event handler */
    onTrTypeChanged(type) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setTransactionType(type.id),
            validation: defaultValidation,
        });
    }

    /** Destination account select 'change' event handler */
    onTransferAccountChanged(account) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setTransferAccount(account.id),
            validation: defaultValidation,
        });
    }

    /** Person select 'change' event handler */
    onPersonChanged(person) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setPerson(person.id),
            validation: defaultValidation,
        });
    }

    /** Source amount field 'input' event handler */
    onSrcAmountInput() {
        const { value } = this.srcAmountInp;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setSourceAmount(value),
            validation: defaultValidation,
        });
    }

    /** Destination amount field 'input' event handler */
    onDestAmountInput() {
        const { value } = this.destAmountInp;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDestAmount(value),
            validation: defaultValidation,
        });
    }

    /** Currency select 'change' event handler */
    onSrcCurrChanged(currency) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setSourceCurrency(currency.id),
            validation: defaultValidation,
        });
    }

    /** Currency select 'change' event handler */
    onDestCurrChanged(currency) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDestCurrency(currency.id),
            validation: defaultValidation,
        });
    }

    /** Date field 'input' event handler */
    onDateInput() {
        const { value } = this.dateInp;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDate(value),
            validation: defaultValidation,
        });
    }

    /** DatePicker select event handler */
    onDateSelect(date) {
        const dateFmt = window.app.formatDate(date);
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setDate(dateFmt),
            validation: defaultValidation,
        });

        this.datePicker.hide();
    }

    /** Category select 'change' event handler */
    onCategoryChanged(category) {
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setCategory(category.id),
            validation: defaultValidation,
        });
    }

    /** Comment field 'input' event handler */
    onCommentInput() {
        const { value } = this.commInp;
        const { transaction } = this.state;
        this.setState({
            ...this.state,
            transaction: transaction.setComment(value),
            validation: defaultValidation,
        });
    }

    validateAmount(value) {
        const amount = parseFloat(fixFloat(value));
        return (!Number.isNaN(amount) && amount > 0);
    }

    /** Validate transaction object */
    validate() {
        const { state } = this;
        const isDiff = state.transaction.isDiff();
        const { transaction } = state;
        const isExpense = (transaction.type === 'expense');

        const sourceAmount = (!isExpense || isDiff)
            ? this.validateAmount(transaction.sourceAmount)
            : true;
        const destAmount = (isExpense || isDiff)
            ? this.validateAmount(transaction.destAmount)
            : true;
        const date = checkDate(transaction.date);
        const valid = (sourceAmount && destAmount && date);

        if (!valid) {
            this.setState({
                ...state,
                validation: {
                    sourceAmount,
                    destAmount,
                    date,
                    valid,
                },
            });
        }

        return valid;
    }

    onSubmit(e) {
        e?.preventDefault();

        if (!this.validate()) {
            return;
        }

        this.reset();
        if (isFunction(this.props.onSave)) {
            this.props.onSave(this.state.transaction);
        }
    }

    cancel() {
        this.reset();
        if (isFunction(this.props.onCancel)) {
            this.props.onCancel();
        }
    }

    renderCurrency(elem, ddown, currencyId) {
        const signElem = elem;
        if (!signElem) {
            return;
        }

        const curr = window.app.model.currency.getItem(currencyId);
        if (!curr) {
            return;
        }

        signElem.textContent = curr.sign;
        ddown?.setSelection(currencyId);
    }

    enableCurrency(currBtn, signElem, value) {
        currBtn.classList.toggle('input-group__btn', value);
        currBtn.classList.toggle('input-group__text', !value);
        signElem.classList.toggle('input-group__btn-title', value);
        signElem.classList.toggle('input-group__text-title', !value);
    }

    enableSourceCurrency(value) {
        this.enableCurrency(this.srcCurrencyBtn, this.srcCurrencySign, value);
    }

    enableDestCurrency(value) {
        this.enableCurrency(this.destCurrencyBtn, this.destCurrencySign, value);
    }

    /** Show date pciker */
    showDatePicker() {
        if (!this.datePicker) {
            this.datePicker = DatePicker.create({
                relparent: this.dateGroup.elem,
                locales: window.app.getCurrrentLocale(),
                onDateSelect: (date) => this.onDateSelect(date),
            });
            insertAfter(this.datePicker.elem, this.dateGroup.elem);
        }

        this.datePicker.show(!this.datePicker.visible());
    }

    renderOriginalData(state, prevState) {
        const { originalData } = state.transaction;
        if (originalData === prevState?.transaction?.originalData) {
            return;
        }

        this.collapse?.show(!!originalData);
        if (!originalData) {
            return;
        }

        const container = OriginalImportData.create({
            ...originalData,
        });

        const content = [container.elem];
        const { similarTransaction } = state.transaction;
        if (similarTransaction) {
            const info = SimilarTransactionInfo.create(similarTransaction);
            content.push(info.elem);
        }

        if (!this.collapse) {
            this.collapse = Collapsible.create({
                toggleOnClick: false,
                className: CONTAINER_CLASS,
                header: null,
            });

            this.elem.append(this.collapse.elem);
        }

        this.collapse.setContent(content);
    }

    renderForm(state, prevState) {
        if (
            state.transaction === prevState?.transaction
            && state.validation === prevState?.validation
        ) {
            return;
        }

        const { transaction } = state;
        const isDiff = transaction.isDiff();
        const realType = transTypeMap[transaction.type];
        if (!realType) {
            throw new Error(`Invalid type of import transaction: ${transaction.type}`);
        }
        const isExpense = transaction.type === 'expense';
        const isIncome = transaction.type === 'income';
        const isTransfer = ['transfer_out', 'transfer_in'].includes(transaction.type);
        const isDebt = ['debt_out', 'debt_in'].includes(transaction.type);

        enable(this.elem, transaction.enabled);

        // Type field
        this.typeDropDown.enable(transaction.enabled);
        this.typeDropDown.setSelection(transaction.type);

        // Source amount field
        const showSrcAmount = (!isExpense || isDiff);
        const srcAmountLabel = (!isExpense && !isDiff)
            ? __('TR_AMOUNT')
            : __('TR_SRC_AMOUNT');

        this.srcAmountField.show(showSrcAmount);
        this.srcAmountField.setTitle(srcAmountLabel);
        window.app.setValidation(this.srcAmountField.elem, state.validation.sourceAmount);

        enable(this.srcAmountInp, transaction.enabled && showSrcAmount);
        this.srcAmountInp.value = transaction.sourceAmount;
        this.srcAmountInp.placeholder = srcAmountLabel;

        this.srcAmountDecimalInput.setState((inpState) => ({
            ...inpState,
            digits: getCurrencyPrecision(transaction.srcCurrId),
        }));

        this.enableSourceCurrency(isIncome);
        this.srcCurrencyDropDown.enable(transaction.enabled && isIncome);
        enable(this.srcCurrencyBtn, transaction.enabled);
        this.renderCurrency(
            this.srcCurrencySign,
            this.srcCurrencyDropDown,
            transaction.srcCurrId,
        );

        // Destination amount field
        const showDestAmount = (isExpense || isDiff);
        const destAmountLabel = (isExpense && !isDiff)
            ? __('TR_AMOUNT')
            : __('TR_DEST_AMOUNT');

        this.destAmountField.show(showDestAmount);
        this.destAmountField.setTitle(destAmountLabel);
        window.app.setValidation(this.destAmountField.elem, state.validation.destAmount);

        enable(this.destAmountInp, transaction.enabled && showDestAmount);
        this.destAmountInp.value = transaction.destAmount;
        this.destAmountInp.placeholder = destAmountLabel;

        this.destAmountDecimalInput.setState((inpState) => ({
            ...inpState,
            digits: getCurrencyPrecision(transaction.destCurrId),
        }));

        this.enableDestCurrency(isExpense);
        this.destCurrencyDropDown.enable(isExpense && transaction.enabled);
        enable(this.destCurrencyBtn, transaction.enabled);
        this.renderCurrency(
            this.destCurrencySign,
            this.destCurrencyDropDown,
            transaction.destCurrId,
        );

        // Transfer account field
        this.transferAccDropDown.enable(transaction.enabled && isTransfer);
        if (isTransfer) {
            const strMainAccountId = transaction.mainAccount.id.toString();
            const accountItems = this.transferAccDropDown.getVisibleItems();
            accountItems.forEach((accountItem) => this.transferAccDropDown.enableItem(
                accountItem.id,
                accountItem.id !== strMainAccountId,
            ));

            const transferAccountId = (transaction.type === 'transfer_in')
                ? transaction.sourceAccountId
                : transaction.destAccountId;
            if (transferAccountId) {
                this.transferAccDropDown.setSelection(transferAccountId);
            }

            const accountLabel = (transaction.type === 'transfer_in')
                ? __('TR_SRC_ACCOUNT')
                : __('TR_DEST_ACCOUNT');
            this.transferAccountField.setTitle(accountLabel);
        }
        this.transferAccountField.show(isTransfer);

        // Person field
        this.personDropDown.enable(transaction.enabled && isDebt);
        if (transaction.personId) {
            this.personDropDown.setSelection(transaction.personId);
        }
        this.personField.show(isDebt);

        // Date field
        this.dateBtn.enable(transaction.enabled);
        this.dateInp.enable(transaction.enabled);
        this.dateInp.value = transaction.date;
        window.app.setValidation(this.dateField.elem, state.validation.date);

        // Category field
        this.categorySelect.setType(realType);
        this.categorySelect.enable(transaction.enabled);
        this.categorySelect.setSelection(transaction.categoryId);

        // Commend field
        enable(this.commInp, transaction.enabled);
        this.commInp.value = transaction.comment;
    }

    /** Render component */
    render(state, prevState = {}) {
        if (!state) {
            throw new Error('Invalid state');
        }

        const title = (state.isUpdate) ? __('TR_UPDATE') : __('TR_CREATE');
        this.popup.setTitle(title);

        this.renderForm(state, prevState);
        this.renderOriginalData(state, prevState);

        const { originalData } = state.transaction;
        this.toggleExtBtn.show(!!originalData);
        this.toggleExtBtn.elem.classList.toggle('rotate', !state.collapsed);
        if (!this.collapse) {
            return;
        }
        if (state.collapsed) {
            this.collapse.collapse();
        } else {
            this.collapse.expand();
        }
    }
}
