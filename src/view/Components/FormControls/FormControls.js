import {
    Component,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';

/* CSS classes */
const CONTROLS_CLASS = 'form-controls';
const SUBMIT_BTN_CLASS = 'submit-btn';
const CANCEL_BTN_CLASS = 'cancel-btn';

const defaultProps = {
    id: undefined,
    submitTitle: 'Submit',
    submitBtnClass: SUBMIT_BTN_CLASS,
    cancelTitle: 'Cancel',
    cancelURL: undefined,
    cancelBtnClass: CANCEL_BTN_CLASS,
    disabled: false,
};

/**
 * Form submit/cancel controls component
 */
export class FormControls extends Component {
    static userProps = {
        elem: ['id'],
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
        this.postInit();
    }

    init() {
        this.submitBtn = Button.create({
            type: 'submit',
            className: this.props.submitBtnClass,
        });

        this.cancelBtn = Button.create({
            type: 'link',
            className: this.props.cancelBtnClass,
        });

        this.elem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: [
                this.submitBtn.elem,
                this.cancelBtn.elem,
            ],
        });
    }

    postInit() {
        this.setClassNames();
        this.render(this.state);
    }

    render(state) {
        if (!state) {
            throw new Error('Invalid state');
        }

        this.submitBtn.setState((btnState) => ({
            ...btnState,
            title: state.submitTitle,
            disabled: state.disabled,
        }));

        this.cancelBtn.setState((btnState) => ({
            ...btnState,
            title: state.cancelTitle,
            url: state.cancelURL,
            disabled: state.disabled,
        }));
        this.cancelBtn.show(state.cancelTitle);
    }
}
