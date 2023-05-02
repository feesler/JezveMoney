import { createElement, Component } from 'jezvejs';
import { __ } from '../../../../utils/utils.js';
import './SimilarTransactionInfo.scss';

/* CSS classes */
const SIMILAR_CLASS = 'similar';
const SIMILAR_TITLE_CLASS = 'similar__title';
const SIMILAR_LINK_CLASS = 'similar__link';

export class SimilarTransactionInfo extends Component {
    constructor(props) {
        super(props);

        if (!this.props?.id) {
            throw new Error('Invalid transaction');
        }

        this.init();
    }

    init() {
        const { baseURL } = window.app;
        const { id } = this.props;
        const url = `${baseURL}transactions/${id}`;

        this.elem = createElement('div', {
            props: { className: SIMILAR_CLASS },
            children: [
                createElement('div', {
                    props: {
                        className: SIMILAR_TITLE_CLASS,
                        textContent: __('IMPORT_SIMILAR_FOUND'),
                    },
                }),
                createElement('a', {
                    props: {
                        className: SIMILAR_LINK_CLASS,
                        href: url,
                        target: '_blank',
                        textContent: __('IMPORT_SIMILAR_OPEN'),
                    },
                }),
            ],
        });
    }
}
