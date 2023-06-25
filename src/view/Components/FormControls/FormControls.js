import {
    Component,
    createElement,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Spinner } from 'jezvejs/Spinner';

/* CSS classes */
const CONTROLS_CLASS = 'form-controls';
const SUBMIT_BTN_CLASS = 'submit-btn';
const CANCEL_BTN_CLASS = 'cancel-btn';
const SPINNER_CLASS = 'request-spinner';

const defaultProps = {
    id: undefined,
    submitTitle: 'Submit',
    submitBtnClass: SUBMIT_BTN_CLASS,
    submitBtnType: 'submit',
    onSubmitClick: null,
    cancelTitle: 'Cancel',
    cancelURL: undefined,
    cancelBtnClass: CANCEL_BTN_CLASS,
    cancelBtnType: 'link',
    onCancelClick: null,
    disabled: false,
    loading: false,
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
            type: this.props.submitBtnType,
            className: this.props.submitBtnClass,
            onClick: (e) => this.props?.onSubmitClick?.(e),
        });

        this.cancelBtn = Button.create({
            type: this.props.cancelBtnType,
            className: this.props.cancelBtnClass,
            onClick: (e) => this.props?.onCancelClick?.(e),
        });

        this.spinner = Spinner.create({ className: SPINNER_CLASS });
        this.spinner.hide();

        this.elem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children: [
                this.submitBtn.elem,
                this.cancelBtn.elem,
                this.spinner.elem,
            ],
        });
    }

    postInit() {
        this.setClassNames();
        this.render(this.state);
    }

    startLoading() {
        this.setLoading(true);
    }

    stopLoading() {
        this.setLoading(false);
    }

    setLoading(value = true) {
        if (this.state.loading === !!value) {
            return;
        }

        this.setState({ ...this.state, loading: !!value });
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
        this.submitBtn.enable(!state.loading);

        this.cancelBtn.setState((btnState) => ({
            ...btnState,
            title: state.cancelTitle,
            url: state.cancelURL,
            disabled: state.disabled,
        }));
        this.cancelBtn.show(state.cancelTitle);
        this.cancelBtn.show(state.cancelTitle && !state.loading);

        this.spinner.show(state.loading);
    }
}
