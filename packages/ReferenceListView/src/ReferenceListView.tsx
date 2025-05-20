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
import ReferenceListItem from './Components/ReferenceListItem';

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

type DataLoaderState = {
    references: ReferenceData;
    success: boolean;
    message?: string;
    loading: boolean;
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
            showHeader: PropTypes.bool
        }).isRequired,
        dataSourcesDataLoader: PropTypes.shape({
            resolveValue: PropTypes.func.isRequired
        }).isRequired
    };

    state: DataLoaderState = {
        references: null,
        success: false,
        message: null,
        loading: false,
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

        this.setState({
            loading: true,
            references: [],
            success: false,
            message: null,
        });

        this.props.dataSourcesDataLoader
        .resolveValue({
            contextNodePath: this.props.focusedNodeContextPath,
            dataSourceIdentifier: this.props.options.dataSource,
            dataSourceUri: this.props.options.dataSourceUri,
            dataSourceAdditionalData
        })
        .then(({ success, message, references }: Partial<DataLoaderState>) => {
            this.setState({
                references,
                success,
                message,
            });
        }).catch(({ message }: Error) => {
            this.setState({
                references: [],
                success: false,
                message: message,
            });
        }).finally(() => {
            this.setState({
                loading: false,
            });
        });
    }

    render() {
        const { references, message, success, loading } = this.state;

        if (loading) {
            return (
                <div>
                    <I18n id='Neos.Neos:Main:loading' />
                </div>
            );
        }

        if (!success) {
            return (
                <div>
                    <Icon icon='exclamation-triangle' className={classes.warnIcon} />
                    {' '}{message}
                </div>
            );
        }

        if (references.length === 0) {
            return (
                <div>
                    {message}
                </div>
            );
        }

        return (
            <Widget
                label={this.props.label}
                subtitle={this.props.options.subtitle}
                showHeader={this.props.options.showHeader}
            >
                <ul className={classes.list}>
                    {references.map((entry, key) => (
                        <ReferenceListItem key={key} entry={entry} />
                    ))}
                </ul>
            </Widget>
        );
    }
}

const mapGlobalRegistryToProps = neos((globalRegistry: any) => ({
    dataSourcesDataLoader: globalRegistry.get('dataLoaders').get('DataSources')
}));

export default connect((state) => ({
    focusedNodeContextPath: selectors.CR.Nodes.focusedNodePathSelector(state),
    getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state)
}))(mapGlobalRegistryToProps(ReferenceListView));
