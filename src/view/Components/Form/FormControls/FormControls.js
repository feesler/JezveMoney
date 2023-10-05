import {
    Component,
    addChilds,
    createElement,
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
    id: undefined,
    submitId: undefined,
    submitTitle: 'Submit',
    submitBtnClass: SUBMIT_BTN_CLASS,
    submitBtnType: 'submit',
    onSubmitClick: null,
    cancelBtn: true,
    cancelTitle: 'Cancel',
    cancelURL: undefined,
    cancelBtnClass: CANCEL_BTN_CLASS,
    cancelBtnType: 'link',
    onCancelClick: null,
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
            id: this.props.submitId,
            type: this.props.submitBtnType,
            className: this.props.submitBtnClass,
            onClick: (e) => this.props?.onSubmitClick?.(e),
        });
        const children = [this.submitBtn.elem];

        if (this.props.cancelBtn) {
            this.cancelBtn = Button.create({
                type: this.props.cancelBtnType,
                className: this.props.cancelBtnClass,
                onClick: (e) => this.props?.onCancelClick?.(e),
            });
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

        this.submitBtn.setState((btnState) => ({
            ...btnState,
            title: state.submitTitle,
            disabled: state.disabled,
        }));
        this.submitBtn.enable(!state.loading);

        if (this.cancelBtn && state.cancelBtn) {
            this.cancelBtn.setState((btnState) => ({
                ...btnState,
                title: state.cancelTitle,
                url: state.cancelURL,
                disabled: state.disabled,
            }));
            this.cancelBtn.show(state.cancelTitle && !state.loading);
        }

        if (this.spinner && state.showSpinner) {
            this.spinner.show(state.loading);
        }
    }
}
