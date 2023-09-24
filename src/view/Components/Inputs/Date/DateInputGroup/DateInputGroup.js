import { createElement } from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { CloseButton } from 'jezvejs/CloseButton';
import { DateInput } from 'jezvejs/DateInput';
import { InputGroup } from 'jezvejs/InputGroup';

const defaultProps = {
    locales: [],
    value: '',
    placeholder: '',
    disabled: false,
    clearButton: false,
    onInput: null,
    onClear: null,
    onToggleDialog: null,
};

/**
 * Date input form field component
 */
export class DateInputGroup extends InputGroup {
    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });
    }

    init() {
        this.input = DateInput.create({
            className: 'input input-group__input',
            locales: this.props.locales,
            placeholder: this.props.placeholder,
            onInput: (e) => this.props.onInput(e),
        });

        this.datePickerBtn = Button.create({
            className: 'input-group__btn calendar-btn',
            icon: 'calendar-icon',
            onClick: (e) => this.props.onToggleDialog(e),
        });

        this.inputOuter = createElement('div', {
            props: { className: 'input-group__input-outer' },
            children: this.input.elem,
        });

        if (this.props.clearButton) {
            this.clearBtn = CloseButton.create({
                className: 'input-group__inner-btn clear-btn',
                onClick: (e) => this.props.onClear(e),
            });
            this.inputOuter.append(this.clearBtn.elem);
        }

        this.props.children = [
            this.inputOuter,
            this.datePickerBtn.elem,
        ];

        super.init();
    }

    enable(value = true) {
        const disabled = !value;
        if (this.state.disabled === disabled) {
            return;
        }

        this.setState({ ...this.state, disabled });
    }

    renderInput(state, prevState) {
        if (state.value !== this.input.value) {
            this.input.value = state.value;
        }
        if (state.disabled !== prevState?.disabled) {
            this.input.enable(!state.disabled);
        }
        if (state.placeholder !== prevState?.placeholder) {
            this.input.elem.placeholder = state.placeholder;
        }
    }

    render(state, prevState = {}) {
        super.enable(!state.disabled);

        this.renderInput(state, prevState);

        if (this.clearBtn) {
            this.clearBtn.show(state.clearButton && state.value.length > 0);
            this.clearBtn.enable(!state.disabled);
        }

        this.datePickerBtn.enable(!state.disabled);
    }
}
