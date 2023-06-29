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
use Neos\Flow\Http\Exception;
use Neos\Flow\I18n\Translator;
use Neos\Flow\Mvc\Routing\Exception\MissingActionNameException;
use Neos\Flow\Persistence\Exception\IllegalObjectTypeException;
use Neos\Neos\Service\DataSource\AbstractDataSource;
use Neos\Neos\Service\LinkingService;

class NodeReferencesDataSource extends AbstractDataSource
{
    /**
     * @var string
     */
    protected static $identifier = 'ShelNodeReferences';

    /**
     * @Flow\Inject
     * @var CompilingEvaluator
     */
    protected $eelEvaluator;

    /**
     * @Flow\Inject
     * @var Translator
     */
    protected $translator;

    /**
     * @Flow\Inject
     * @var LinkingService
     */
    protected $linkingService;

    /**
     * @Flow\Inject
     * @var NodeDataRepository
     */
    protected $nodeDataRepository;

    /**
     * @Flow\Inject
     * @var NodeFactory
     */
    protected $nodeFactory;

    /**
     * @Flow\InjectConfiguration(path="nodeTypeFilter", package="Shel.ReferenceList")
     * @var string
     */
    protected $nodeTypeFilter;

    /**
     * Get references for the given node
     *
     * {@inheritdoc}
     */
    public function getData(NodeInterface $node = null, array $arguments = [])
    {
        if (!$node) {
            return [];
        }

        $references = [];
        $siteNode = $node->getContext()->getCurrentSiteNode();

        $referenceNodeData = $this->nodeDataRepository->findByParentAndNodeTypeRecursively(
            $siteNode->getPath(),
            $this->nodeTypeFilter,
            $node->getWorkspace(),
            $node->getDimensions()
        );

        $nodesWithReferences = array_filter(array_map(function (NodeData $nodeData) use ($node) {
            return $this->nodeFactory->createFromNodeData($nodeData, $node->getContext());
        }, $referenceNodeData));

        /** @var NodeInterface $nodeWithReference */
        foreach ($nodesWithReferences as $nodeWithReference) {
            if ($nodeWithReference->hasProperty('references') && in_array($node,
                    $nodeWithReference->getProperty('references'), true)) {
                $documentNode = $nodeWithReference;
                while ($documentNode && !$documentNode->getNodeType()->isOfType('Neos.Neos:Document')) {
                    $documentNode = $documentNode->getParent();
                }

                if (!$documentNode) {
                    continue;
                }

                try {
                    $link = $this->linkingService->createNodeUri(
                        $this->controllerContext,
                        $documentNode,
                        $siteNode,
                        'html',
                        true
                    );
                } catch (\Exception $e) {
                    $link = null;
                }

                if (array_key_exists($documentNode->getIdentifier(), $references)) {
                    $references[$documentNode->getIdentifier()]['count']++;
                    continue;
                }
                $references[$documentNode->getIdentifier()] = [
                    'reference' => $documentNode->getLabel(),
                    'link' => $link,
                    'icon' => $nodeWithReference->getNodeType()->getFullConfiguration()['ui']['icon'] ?? null,
                    'count' => 1
                ];
            }
        }

        if (count($references) === 0) {
            $references[] = [
                'reference' => $this->translator->translateById(
                    'noReferencesFound',
                    [],
                    null,
                    null,
                    'Main',
                    'Shel.ReferenceList'
                )
            ];
        }

        return [
            'data' => [
                'references' => array_values($references),
            ]
        ];
    }
}
