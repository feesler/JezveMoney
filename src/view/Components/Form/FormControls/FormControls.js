import {
    Component,
    addChilds,
    createElement,
    isObject,
} from 'jezvejs';
import { Button } from 'jezvejs/Button';
import { Spinner } from 'jezvejs/Spinner';
import './FormControls.scss';

/* CSS classes */
const CONTROLS_CLASS = 'form-controls';
const SUBMIT_BTN_CLASS = 'submit-btn';
const CANCEL_BTN_CLASS = 'cancel-btn';
const SPINNER_CLASS = 'request-spinner';

const defaultProps = {
    submitBtn: {
        title: 'Submit',
        type: 'submit',
        className: SUBMIT_BTN_CLASS,
        onClick: null,
    },
    cancelBtn: {
        title: 'Cancel',
        type: 'link',
        className: CANCEL_BTN_CLASS,
        onClick: null,
    },
    disabled: false,
    showSpinner: true,
    controls: null,
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
        const controlsProps = {
            ...defaultProps,
            ...props,
        };

        if (isObject(props.submitBtn)) {
            controlsProps.submitBtn = {
                ...defaultProps.submitBtn,
                ...props.submitBtn,
            };
        }

        if (isObject(props.cancelBtn)) {
            controlsProps.cancelBtn = {
                ...defaultProps.cancelBtn,
                ...props.cancelBtn,
            };
        }

        super(controlsProps);

        this.state = {
            ...this.props,
        };

        this.init();
        this.postInit();
    }

    init() {
        const children = [];

        if (this.props.submitBtn) {
            this.submitBtn = Button.create({ ...this.props.submitBtn });
            children.push(this.submitBtn.elem);
        }

        if (this.props.cancelBtn) {
            this.cancelBtn = Button.create({ ...this.props.cancelBtn });
            children.push(this.cancelBtn.elem);
        }

        if (this.props.showSpinner) {
            this.spinner = Spinner.create({ className: SPINNER_CLASS });
            this.spinner.hide();
            children.push(this.spinner.elem);
        }

        this.elem = createElement('div', {
            props: { className: CONTROLS_CLASS },
            children,
        });

        addChilds(this.elem, this.props.controls);
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

        if (this.submitBtn && state.submitBtn) {
            this.submitBtn.setState((btnState) => ({
                ...btnState,
                ...state.submitBtn,
                disabled: state.submitBtn.disabled || state.disabled,
            }));
            this.submitBtn.enable(!state.loading);
        }

        if (this.cancelBtn && state.cancelBtn) {
            this.cancelBtn.setState((btnState) => ({
                ...btnState,
                ...state.cancelBtn,
                disabled: state.cancelBtn.disabled || state.disabled,
            }));
        }
        this.cancelBtn?.show(state.cancelBtn && !state.loading);

        if (this.spinner && state.showSpinner) {
            this.spinner.show(state.loading);
        }
    }
}
