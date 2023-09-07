import {
    createElement,
    getClassName,
    re,
    isFunction,
    Component,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import 'jezvejs/style/Input';
import { InputGroup } from 'jezvejs/InputGroup';
import './SearchInput.scss';

/** CSS classes */
const CONTAINER_CLASS = 'search-field input-group__input-outer';
const INPUT_CLASS = 'input input-group__input';
const INNER_BTN_CLASS = 'btn input-group__inner-btn';
const CLEAR_BTN_CLASS = 'clear-btn';
const SEARCH_BTN_CLASS = 'search-btn';

const defaultProps = {
    id: undefined,
    name: undefined,
    form: undefined,
    placeholder: undefined,
    value: '',
    onChange: null,
};

/**
 * Search input component
 */
export class SearchInput extends Component {
    static userProps = {
        elem: ['id'],
        input: ['id', 'name', 'form', 'placeholder'],
    };

    constructor(props = {}) {
        super({
            ...defaultProps,
            ...props,
        });

        this.state = {
            ...this.props,
        };

        this.init();
    }

    get value() {
        return this.state.value;
    }

    set value(val) {
        if (this.value === val) {
            return;
        }

        this.setState({ ...this.state, value: val });
    }

    init() {
        this.input = createElement('input', {
            props: {
                className: INPUT_CLASS,
                type: 'text',
                autocomplete: 'off',
                inputMode: 'search',
            },
            events: { input: (e) => this.onInput(e) },
        });

        this.clearBtn = Button.create({
            icon: 'close-sm',
            className: getClassName(INNER_BTN_CLASS, CLEAR_BTN_CLASS),
            onClick: (e) => this.onClear(e),
        });

        this.searchBtn = Button.create({
            type: 'static',
            icon: 'search',
            className: getClassName(INNER_BTN_CLASS, SEARCH_BTN_CLASS),
        });

        this.inputGroup = InputGroup.create({
            className: CONTAINER_CLASS,
            children: [
                this.searchBtn.elem,
                this.input,
            ],
        });
        this.elem = this.inputGroup.elem;

        this.setUserProps();

        this.setClassNames();
        this.render(this.state);
    }

    onInput() {
        this.setState({ ...this.state, value: this.input.value });
        this.sendChangeEvent();
    }

    onClear() {
        this.setState({ ...this.state, value: '' });
        this.sendChangeEvent();
    }

    sendChangeEvent() {
        if (isFunction(this.props.onChange)) {
            this.props.onChange(this.state.value);
        }
    }

    render(state) {
        const value = state.value ?? '';
        this.input.value = value;

        if (value.length > 0) {
            this.elem.append(this.clearBtn.elem);
        } else {
            re(this.clearBtn.elem);
        }
    }
}
