import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import style from './style.css';
import I18n from '@neos-project/neos-ui-i18n';

export default class Widget extends PureComponent {
    static propTypes = {
        label: PropTypes.string.isRequired,
        subtitle: PropTypes.string,
        children: PropTypes.object,
        showHeader: PropTypes.bool
    }

    render() {
        const {label, subtitle, children, showHeader} = this.props;

        return (
            <div className={style.widget}>
                {showHeader && (<div className={style.header}>
                    <div className={style.label}><I18n id={label}/></div> {subtitle && (<div className={style.subtitle}>{subtitle}</div>)}
                </div>)}
                <div className={style.body}>{children}</div>
            </div>
        );
    }
}
