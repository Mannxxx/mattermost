// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import LocalizedIcon from 'components/localized_icon';

import {t} from 'utils/i18n';

type Props = {
    additionalClassName: string | null;
}

export default class PreviousIcon extends React.PureComponent<Props> {
    public static defaultProps: Props = {
        additionalClassName: null,
    };

    public render(): JSX.Element {
        const className = 'icon icon-chevron-left' + (this.props.additionalClassName ? ' ' + this.props.additionalClassName : '');
        return (
            <LocalizedIcon
                className={className}
                title={{id: t('generic_icons.previous'), defaultMessage: 'Previous Icon'}}
            />
        );
    }
}
