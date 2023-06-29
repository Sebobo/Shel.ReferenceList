import ReferenceListView from './ReferenceListView';

import manifest from '@neos-project/neos-ui-extensibility';

manifest('Shel.ReferenceList:ReferenceListView', {}, (globalRegistry) => {
    const viewsRegistry = globalRegistry.get('inspector').get('views');

    viewsRegistry.set('Shel.ReferenceList/Inspector/Views/ReferenceListView', {
        component: ReferenceListView,
    });
});
