import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {$get} from 'plow-js';
import style from './style.css';
import dataLoader from './DataLoader/index';
import {Icon} from '@neos-project/react-ui-components';

@dataLoader()
export default class ReferenceListView extends PureComponent {
    static propTypes = {
        data: PropTypes.object.isRequired,
        options: PropTypes.shape({
            collection: PropTypes.string,
            columns: PropTypes.array
        }).isRequired
    }

    getRows() {
        const {options, data} = this.props;
        const collectionPath = options.collection;
        if (!data || !collectionPath) {
            return [];
        }
        const collection = $get(collectionPath, data);
        const {columns} = options;
        return collection.map(row => columns.map(column => {
            const rowValue = {
                value: $get(column.data, row),
                link: $get(column.link, row),
                suffix: column.suffix,
            };
            if (column.iconMap) {
                rowValue.icon = column.iconMap[rowValue.value];
            }
            return rowValue;
        }));
    }

    render() {
        const rows = this.getRows();

        return (
            <table className={style.table}>
                <tbody>
                {rows.map((row, key) => (
                    <tr key={key} className={style.row}>
                        {row.map((column, key) => (
                            <td key={key} className={style.column}>
                                {column.icon && (<Icon className={style.icon} icon={column.icon}/>)}

                                {column.link ? (
                                    <a href={column.link} target="_blank">{column.value}{column.suffix}</a>
                                ) : (
                                    <span>{column.value}{column.suffix}</span>
                                    )}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        );
    }
}
