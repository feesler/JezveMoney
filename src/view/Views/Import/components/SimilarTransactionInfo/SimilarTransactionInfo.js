import { Component } from 'jezvejs';
import { createElement } from '@jezvejs/dom';
import { __ } from '../../../../utils/utils.js';
import { App } from '../../../../Application/App.js';
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
        const { baseURL } = App;
        const { id } = this.props;
        const url = `${baseURL}transactions/${id}`;

        this.elem = createElement('div', {
            props: { className: SIMILAR_CLASS },
            children: [
                createElement('div', {
                    props: {
                        className: SIMILAR_TITLE_CLASS,
                        textContent: __('import.similarFound'),
                    },
                }),
                createElement('a', {
                    props: {
                        className: SIMILAR_LINK_CLASS,
                        href: url,
                        target: '_blank',
                        textContent: __('import.openSimilar'),
                    },
                }),
            ],
        });
    }
}
