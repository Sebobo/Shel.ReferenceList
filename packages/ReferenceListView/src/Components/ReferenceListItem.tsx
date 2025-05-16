import React from 'react';
import { Icon } from '@neos-project/react-ui-components';

import * as classes from './ReferenceListItem.module.css';

const ReferenceListItem: React.FC<{ entry: ReferenceData }> = ({ entry }) => {
    return (
        <div className={classes.item}>
            <span>
                {entry.link ? (
                    <a href={entry.link} target='_blank' rel='noreferrer' title={entry.reference}>
                        <Icon className={classes.icon} icon={entry.icon} />
                        {entry.reference}
                    </a>
                ) : (
                    <span>
                        <Icon className={classes.icon} icon={entry.icon} />
                        {entry.reference}
                    </span>
                )}
                {entry.count > 1 ? ` (${entry.count}x)` : ''}
            </span>
            <ol className={classes.breadcrumb}>
                {entry.breadcrumb.map((item, index) => (
                    <li key={index}>
                        {item}
                    </li>
                ))}
            </ol>
        </div>
    );
};

export default React.memo(ReferenceListItem);
