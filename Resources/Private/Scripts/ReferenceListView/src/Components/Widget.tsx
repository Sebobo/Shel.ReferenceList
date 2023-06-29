import React from 'react';

// @ts-ignore
import I18n from '@neos-project/neos-ui-i18n';

import style from './Widget.module.css';

type WidgetProps = {
    label: string;
    subtitle?: string;
    showHeader?: boolean;
    children: React.ReactNode;
};

const Widget: React.FC<WidgetProps> = ({ label, subtitle, children, showHeader }) => {
    return (
        <div className={style.widget}>
            {showHeader && (
                <div className={style.header}>
                    <div className={style.label}>
                        <I18n id={label} />
                    </div>
                    {subtitle && <div className={style.subtitle}>{subtitle}</div>}
                </div>
            )}
            <div className={style.body}>{children}</div>
        </div>
    );
};

export default React.memo(Widget);
