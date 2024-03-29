import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

// @ts-ignore
import { neos } from '@neos-project/neos-ui-decorators';
// @ts-ignore
import { selectors } from '@neos-project/neos-ui-redux-store';
// @ts-ignore
import I18n from '@neos-project/neos-ui-i18n';
import { Icon } from '@neos-project/react-ui-components';

import Widget from './Components/Widget';

import * as classes from './ReferenceListView.module.css';

type ReferenceListViewProps = {
    focusedNodeContextPath: string;
    getNodeByContextPath: CallableFunction;
    label: string;
    showHeader?: boolean;
    options: {
        arguments: object;
        dataSource: string;
        dataSourceUri: string;
        subtitle: string;
        showHeader: boolean;
    };
    dataSourcesDataLoader: {
        resolveValue: CallableFunction;
    };
};

type ReferenceData = {
    references: {
        reference: string;
        link?: string;
        icon?: string;
        count: number;
    }[];
};

type DataLoaderState = {
    data: ReferenceData;
    error: false | { message: string };
};

class ReferenceListView extends PureComponent<ReferenceListViewProps> {
    static propTypes = {
        focusedNodeContextPath: PropTypes.string,
        getNodeByContextPath: PropTypes.func.isRequired,
        label: PropTypes.string,
        showHeader: PropTypes.bool,
        options: PropTypes.shape({
            arguments: PropTypes.object,
            dataSource: PropTypes.string,
            dataSourceUri: PropTypes.string,
            subtitle: PropTypes.string,
            showHeader: PropTypes.bool,
        }).isRequired,
        dataSourcesDataLoader: PropTypes.shape({
            resolveValue: PropTypes.func.isRequired,
        }).isRequired,
    };

    state: DataLoaderState = {
        data: null,
        error: false,
    };

    componentDidMount() {
        this.fetchData();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.focusedNodeContextPath !== this.props.focusedNodeContextPath) {
            this.fetchData();
        }
    }

    fetchData() {
        const dataSourceAdditionalData = Object.assign(
            { node: this.props.focusedNodeContextPath },
            this.props.options.arguments
        );

        this.props.dataSourcesDataLoader
            .resolveValue({
                contextNodePath: this.props.focusedNodeContextPath,
                dataSourceIdentifier: this.props.options.dataSource,
                dataSourceUri: this.props.options.dataSourceUri,
                dataSourceAdditionalData,
            })
            .then((response) => {
                if (response.error) {
                    this.setState({
                        data: null,
                        error: response.error,
                    });
                } else if (response.data) {
                    this.setState({
                        data: response.data,
                        error: false,
                    });
                } else {
                    this.setState({
                        data: null,
                        error: new Error('Unknown datasource fetch error'),
                    });
                }
            });
    }

    render() {
        const { data, error } = this.state;

        if (error) {
            return (
                <div>
                    <Icon icon="exclamation-triangle" className={classes.warnIcon} />
                    {error['message']}
                </div>
            );
        }

        if (!data) {
            return (
                <div>
                    <I18n id="Neos.Neos:Main:loading" />
                </div>
            );
        }

        const references = data && data.references ? data.references : [];

        return (
            <Widget
                label={this.props.label}
                subtitle={this.props.options.subtitle}
                showHeader={this.props.options.showHeader}
            >
                <table className={classes.table}>
                    <tbody>
                        {references.map((entry, key) => (
                            <tr key={key}>
                                <td className={classes.column}>
                                    <Icon className={classes.icon} icon={entry.icon} />
                                    <span>
                                        {entry.link ? (
                                            <a href={entry.link} target="_blank" rel="noreferrer">
                                                {entry.reference}
                                            </a>
                                        ) : (
                                            <span>{entry.reference}</span>
                                        )}
                                        {entry.count > 1 ? ` (${entry.count}x)` : ''}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Widget>
        );
    }
}

const mapGlobalRegistryToProps = neos((globalRegistry: any) => ({
    dataSourcesDataLoader: globalRegistry.get('dataLoaders').get('DataSources'),
}));

export default connect((state) => ({
    focusedNodeContextPath: selectors.CR.Nodes.focusedNodePathSelector(state),
    getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state),
}))(mapGlobalRegistryToProps(ReferenceListView));
