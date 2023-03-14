import {
    createElement,
    re,
    Component,
} from 'jezvejs';
import { Collapsible } from 'jezvejs/Collapsible';
import './ApiRequest.scss';

/** CSS classes */
const CONTAINER_CLASS = 'request-item';
const REQUEST_CONTAINER_CLASS = 'request-container';
const REQUEST_DATA_CLASS = 'request-details';
const RESPONSE_CONTAINER_CLASS = 'response-container';
const RESPONSE_PENDING_CLASS = 'response-container_pending';
const TITLE_CLASS = 'title';
const RESPONSE_OK_CLASS = 'ok-result';
const RESPONSE_FAIL_CLASS = 'fail-result';
const RESPONSE_DATA_CLASS = 'response-details';

const defaultProps = {
    response: null,
};

/**
 * API request component
 */
export class ApiRequest extends Component {
    static create(props) {
        return new ApiRequest(props);
    }

    constructor(props) {
        super(props);

        this.props = {
            ...defaultProps,
            ...this.props,
        };
        this.state = {
            ...this.props,
        };

        this.init();
    }

    init() {
        this.elem = createElement('div', { props: { className: CONTAINER_CLASS } });

        this.setClassNames();
        this.render(this.state);
    }

    addResult(result, title, rawResult) {
        this.setState({
            ...this.state,
            response: {
                result,
                title,
                rawResult,
            },
        });
    }

    renderRequest(state, prevState) {
        const { request } = state;
        if (request === prevState.request) {
            return;
        }

        const { baseURL } = window.app;
        const method = (request.options?.method) ? request.options.method : 'GET';
        const body = request.options?.body;

        let reqText = request.url.toString();
        if (reqText.startsWith(baseURL)) {
            reqText = reqText.substring(baseURL.length);
        }
        const titleElem = createElement('div', {
            props: { className: TITLE_CLASS, textContent: `${method} ${reqText}` },
        });

        if (body) {
            const bodyElem = createElement('div', {
                props: { className: REQUEST_DATA_CLASS, textContent: body },
            });

            this.requestContainer = Collapsible.create({
                className: REQUEST_CONTAINER_CLASS,
                header: titleElem,
                content: bodyElem,
            });
            this.elem.append(this.requestContainer.elem);
        } else {
            this.requestContainer = createElement('div', {
                props: { className: REQUEST_CONTAINER_CLASS },
                children: titleElem,
            });
            this.elem.append(this.requestContainer);
        }
    }

    renderLoading() {
        this.resultContainer = createElement('div', {
            props: {
                className: [RESPONSE_CONTAINER_CLASS, RESPONSE_PENDING_CLASS].join(),
                textContent: 'Pending...',
            },
        });

        this.elem.append(this.resultContainer);
    }

    renderResponse(state, prevState) {
        const { response } = state;
        if (response === prevState.response) {
            return;
        }

        if (!response) {
            this.renderLoading();
            return;
        }

        re(this.resultContainer);

        const titleEl = createElement('div', {
            props: { className: TITLE_CLASS, textContent: response.title },
        });

        const resultClassName = (response.result) ? RESPONSE_OK_CLASS : RESPONSE_FAIL_CLASS;
        this.resultContainer = Collapsible.create({
            className: [RESPONSE_CONTAINER_CLASS, resultClassName],
            header: titleEl,
        });
        if (response.rawResult) {
            const responseElem = createElement('div', {
                props: { className: RESPONSE_DATA_CLASS, textContent: response.rawResult },
            });
            this.resultContainer.setContent(responseElem);
        }

        this.elem.append(this.resultContainer.elem);
    }

    render(state, prevState = {}) {
        this.renderRequest(state, prevState);
        this.renderResponse(state, prevState);
    }
}
