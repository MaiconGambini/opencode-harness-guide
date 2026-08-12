import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Começando',
      link: { type: 'doc', id: 'getting-started/installation' },
      items: [
        'getting-started/prerequisites',
        'getting-started/installation',
        'getting-started/first-session',
      ],
    },
    {
      type: 'category',
      label: 'Conceitos',
      link: { type: 'doc', id: 'concepts/why-a-harness' },
      items: [
        'concepts/why-a-harness',
        'concepts/seven-components',
        'concepts/prevc',
        'concepts/continual-harness-v1-3',
        'concepts/wip-one',
        'concepts/evidence-and-handoff',
        'concepts/automation',
      ],
    },
    {
      type: 'category',
      label: 'Guias',
      items: [
        'guides/small-task',
        'guides/complex-feature',
        'guides/existing-project',
        'guides/portability',
      ],
    },
    {
      type: 'category',
      label: 'Referência',
      items: [
        'reference/commands',
        'reference/skills',
        'reference/agents',
        'reference/artifacts',
        'reference/repository-structure',
        'reference/references',
      ],
    },
    {
      type: 'category',
      label: 'Adoção',
      link: { type: 'doc', id: 'adoption/use-cases' },
      items: [
        'adoption/use-cases',
        'adoption/pros-and-cons',
        'adoption/security',
        'adoption/limitations',
      ],
    },
    {
      type: 'category',
      label: 'Solução de problemas',
      items: ['troubleshooting/faq'],
    },
  ],
};

export default sidebars;

// docs deploy: why/result rationale + PT accents + agents/references
