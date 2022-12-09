import { createElement, Component } from 'jezvejs';
import './style.scss';

/* CSS classes */
const SIMILAR_CLASS = 'similar';
const SIMILAR_TITLE_CLASS = 'similar__title';
const SIMILAR_LINK_CLASS = 'similar__link';

/* Strings */
const STR_SIMILAR_FOUND = 'Similar transaction found: ';
const STR_SIMILAR_LINK = 'Edit';

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
        const url = `${baseURL}transactions/update/${id}`;

        this.elem = createElement('div', {
            props: { className: SIMILAR_CLASS },
            children: [
                createElement('div', {
                    props: {
                        className: SIMILAR_TITLE_CLASS,
                        textContent: STR_SIMILAR_FOUND,
                    },
                }),
                createElement('a', {
                    props: {
                        className: SIMILAR_LINK_CLASS,
                        href: url,
                        textContent: STR_SIMILAR_LINK,
                    },
                }),
            ],
        });
    }
}
