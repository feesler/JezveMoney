import { createElement, isFunction } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { DecimalInput } from 'jezvejs/DecimalInput';
import { DropDown } from 'jezvejs/DropDown';
import { InputGroup } from 'jezvejs/InputGroup';
import { Field } from '../Field/Field.js';
import { __ } from '../../utils/utils.js';

const defaultProps = {
    value: '',
    placeholder: '',
    currencyId: 0,
    enableSelect: false,
    disabled: false,
    validate: false,
    feedbackMessage: null,
    valid: true,
    onInput: null,
    onSelectCurrency: null,
};

/**
 * Amount input form field component
 */
export class AmountInputField extends Field {
    static userProps = {
        elem: ['id'],
        titleElem: ['htmlFor'],
        input: ['placeholder'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.input = DecimalInput.create({
            className: 'input input-group__input right-align-text',
            onInput: (e) => this.onInput(e),
        });

        this.currencySign = createElement('div', {
            props: {
                className: 'input-group__btn-title',
            },
        });

        this.currencyBtn = Button.create({
            className: 'input-group__btn',
            tabIndex: -1,
            title: this.currencySign,
        });

        this.group = InputGroup.create({
            children: [
                this.input.elem,
                this.currencyBtn.elem,
            ],
        });

        this.state.content = [
            this.group.elem,
        ];

        if (this.state.validate) {
            this.feedbackElem = createElement('div', {
                props: {
                    className: 'feedback invalid-feedback',
                    textContent: __('TR_INVALID_AMOUNT'),
                },
            });

            this.state.content.push(this.feedbackElem);
        }

        super.init();
    }

    /** Initialize DropDown for currency */
    createCurrencyList({ elem, onItemSelect, currId }) {
        const res = DropDown.create({
            elem,
            onItemSelect,
            listAttach: true,
            enableFilter: true,
        });

        window.app.initUserCurrencyList(res);
        if (currId) {
            res.setSelection(currId);
        }

        return res;
    }

    createSelect(state) {
        if (this.dropDown) {
            return;
        }

        this.dropDown = this.createCurrencyList({
            elem: this.currencySign,
            currId: state.currencyId,
            onItemSelect: (item) => this.onSelectCurrency(item),
        });
    }

    onInput(e) {
        if (isFunction(this.props.onInput)) {
            this.props.onInput(e);
        }
    }

    onSelectCurrency(item) {
        if (isFunction(this.props.onSelectCurrency)) {
            this.props.onSelectCurrency(item);
        }
    }

    enableSelect(value) {
        this.setState({ ...this.state, enableSelect: !!value });
    }

    renderCurrency(state, prevState) {
        if (state.currencyId === prevState?.currencyId) {
            return;
        }

        const currencyModel = window.app.model.currency;
        const currency = currencyModel.getItem(state.currencyId);
        this.currencySign.textContent = (currency) ? currency.sign : '';

        if (!currency) {
            return;
        }

        this.input.setState((inpState) => ({
            ...inpState,
            digits: currency.precision,
        }));

        if (this.dropDown) {
            this.dropDown.setSelection(state.currencyId);
        }
    }

    renderSelect(state, prevState) {
        const { enableSelect } = state;
        if (enableSelect === prevState?.enableSelect) {
            return;
        }

        const currBtn = this.currencyBtn.elem;
        currBtn.classList.toggle('btn', enableSelect);
        currBtn.classList.toggle('input-group__btn', enableSelect);
        currBtn.classList.toggle('input-group__text', !enableSelect);
        this.currencySign.classList.toggle('input-group__btn-title', enableSelect);
        this.currencySign.classList.toggle('input-group__text-title', !enableSelect);

        if (enableSelect && !this.dropDown) {
            this.createSelect(state);
        }

        if (this.dropDown) {
            this.dropDown.enable(enableSelect);
        }
    }

    renderInput(state, prevState) {
        if (state.value !== prevState?.value) {
            this.input.value = state.value;
        }

        if (state.disabled !== prevState?.disabled) {
            this.input.enable(!state.disabled);
            this.currencyBtn.enable(!state.disabled);
        }
        if (state.placeholder !== prevState?.placeholder) {
            this.input.elem.placeholder = state.placeholder;
        }
    }

    render(state, prevState = {}) {
        super.render(state, prevState);

        this.elem.classList.toggle('validation-block', state.validate);
        if (state.validate) {
            window.app.setValidation(this.elem, state.valid);
            this.feedbackElem.textContent = state.feedbackMessage;
        }

        this.renderCurrency(state, prevState);
        this.renderSelect(state, prevState);
        this.renderInput(state, prevState);
    }
}
