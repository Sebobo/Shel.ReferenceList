<?php

declare(strict_types=1);

namespace Shel\ReferenceList\DataSource;

/*
 * This file is part of the Shel.ReferenceList package.
 */

use Neos\ContentRepository\Domain\Factory\NodeFactory;
use Neos\ContentRepository\Domain\Model\NodeData;
use Neos\ContentRepository\Domain\Model\NodeInterface;
use Neos\ContentRepository\Domain\Repository\NodeDataRepository;
use Neos\Eel\CompilingEvaluator;
use Neos\Flow\Annotations as Flow;
use Neos\Flow\I18n\Translator;
use Neos\Flow\Mvc\Routing\UriBuilder;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Neos\Neos\Service\LinkingService;

#[Flow\Scope('singleton')]
class NodeReferencesDataSource extends AbstractDataSource
{
    /**
     * Property types that are considered as references
     */
    protected const REFERENCE_PROPERTY_TYPES = ['reference', 'references'];

    /**
     * @var string
     */
    protected static $identifier = 'ShelNodeReferences';

    #[Flow\InjectConfiguration('nodeTypeFilter', 'Shel.ReferenceList')]
    protected ?string $nodeTypeFilter;

    protected array $propertyNamesByNodeTypeCache = [];

    public function __construct(
        protected readonly CompilingEvaluator $eelEvaluator,
        protected readonly Translator $translator,
        protected readonly LinkingService $linkingService,
        protected readonly NodeDataRepository $nodeDataRepository,
        protected readonly NodeFactory $nodeFactory,
        protected readonly UriBuilder $uriBuilder
    ) {
    }

    /**
     * Get references for the given node
     *
     * @return array{data: array{references: array{reference: string, link: string, icon: string, count: int}}}
     */
    public function getData(NodeInterface $node = null, array $arguments = []): array
    {
        if (!$node) {
            return [];
        }

        $references = [];
        $siteNode = $node->getContext()->getCurrentSiteNode();
        $nodesWithReferences = $this->getNodesWithReferences($siteNode, $node);

        foreach ($nodesWithReferences as $nodeWithReference) {
            $referencePropertyNames = $this->getReferenceTypePropertyNames($nodeWithReference);
            foreach ($referencePropertyNames as $propertyName) {
                if ($nodeWithReference->hasProperty($propertyName) && in_array($node,
                        $nodeWithReference->getProperty($propertyName), true)) {
                    $documentNode = $this->getClosestDocumentNode($nodeWithReference);
                    if (!$documentNode) {
                        continue;
                    }

                    // Duplicates add to the count
                    if (array_key_exists($documentNode->getIdentifier(), $references)) {
                        $references[$documentNode->getIdentifier()]['count']++;
                        continue;
                    }

                    $references[$documentNode->getIdentifier()] = [
                        'reference' => $documentNode->getLabel(),
                        'breadcrumb' => $this->getBreadcrumb($documentNode),
                        'link' => $this->getNodeUri($documentNode),
                        'icon' => $nodeWithReference->getNodeType()->getFullConfiguration()['ui']['icon'] ?? null,
                        'count' => 1
                    ];
                }
            }
        }

        // Fallback if no references are found
        if (count($references) === 0) {
            $references[] = [
                'reference' => $this->translateById('noReferencesFound'),
            ];
        }

        return [
            'data' => [
                'references' => array_values($references),
            ]
        ];
    }

    /**
     * Returns the property names of the given node type that are of the defined reference types
     *
     * @return string[]
     */
    protected function getReferenceTypePropertyNames(NodeInterface $nodeWithReference): array
    {
        $nodeTypeName = $nodeWithReference->getNodeType()->getName();
        if (array_key_exists($nodeTypeName, $this->propertyNamesByNodeTypeCache)) {
            return $this->propertyNamesByNodeTypeCache[$nodeTypeName];
        }
        $properties = $nodeWithReference->getNodeType()->getProperties();
        $propertyNames = [];
        foreach ($properties as $propertyName => $propertyConfiguration) {
            $type = $propertyConfiguration['type'] ?? null;
            if (in_array($type, self::REFERENCE_PROPERTY_TYPES, true)) {
                $propertyNames[] = $propertyName;
            }
        }
        $this->propertyNamesByNodeTypeCache[$nodeTypeName] = $propertyNames;
        return $propertyNames;
    }

    /**
     * Find all nodes with that reference other nodes based on the configured node type filter
     * @return NodeInterface[]
     */
    protected function getNodesWithReferences($siteNode, NodeInterface $node): array
    {
        $referenceNodeData = $this->nodeDataRepository->findByParentAndNodeTypeRecursively(
            $siteNode->getPath(),
            $this->nodeTypeFilter,
            $node->getWorkspace(),
            $node->getDimensions()
        );

        // Get actual node objects from the node data and filter the ones that couldn't be created and errors
        /** @var NodeInterface[] $nodesWithReferences */
        $nodesWithReferences = array_filter(array_map(function (NodeData $nodeData) use ($node) {
            try {
                return $this->nodeFactory->createFromNodeData($nodeData, $node->getContext());
            } catch (\Exception) {
                return null;
            }
        }, $referenceNodeData));
        return $nodesWithReferences;
    }

    protected function getClosestDocumentNode(NodeInterface $nodeWithReference): ?NodeInterface
    {
        $documentNode = $nodeWithReference;
        while ($documentNode && !$documentNode->getNodeType()->isOfType('Neos.Neos:Document')) {
            $documentNode = $documentNode->getParent();
        }
        return $documentNode;
    }

    protected function getNodeUri(NodeInterface $documentNode): ?string
    {
        try {
            $this->uriBuilder->reset();
            $this->uriBuilder->setRequest($this->controllerContext->getRequest());
            $this->uriBuilder->setCreateAbsoluteUri(true);
            $this->uriBuilder->setFormat('html');
            $link = $this->uriBuilder->uriFor(
                'index',
                [
                    'node' => $documentNode,
                ],
                'Backend',
                'Neos.Neos.Ui'
            );
        } catch (\Exception) {
            $link = null;
        }
        return $link;
    }

    protected function translateById(string $id): string
    {
        try {
            return $this->translator->translateById(
                $id,
                [],
                null,
                null,
                'Main',
                'Shel.ReferenceList'
            ) ?? $id;
        } catch (\Exception) {
            return $id;
        }
    }

    protected function getBreadcrumb(NodeInterface $documentNode): array
    {
        $breadcrumb = [];
        $parent = $documentNode->getParent();
        while ($parent?->getNodeType()->isOfType('Neos.Neos:Document')) {
            $breadcrumb[] = $parent->getLabel();
            $parent = $parent->getParent();
        }
        return array_reverse($breadcrumb);
    }
}
