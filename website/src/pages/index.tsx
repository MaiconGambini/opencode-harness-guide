import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Translate, { translate } from '@docusaurus/Translate';

function HomepageHeader() {
  return (
    <header
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #0b1020 0%, #11192e 100%)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ifm-color-primary)',
          marginBottom: '0.5rem',
        }}
      >
        <Translate id="homepage.eyebrow">Controlled Agent Workflow</Translate>
      </p>
      <h1
        style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 700,
          maxWidth: 600,
          margin: '0 auto 1rem',
          lineHeight: 1.15,
        }}
      >
        <Translate id="homepage.title">
          Trabalho de agentes que voce consegue retomar, verificar e auditar.
        </Translate>
      </h1>
      <p
        style={{
          maxWidth: 560,
          margin: '0 auto 1.5rem',
          color: 'var(--text-secondary)',
          fontSize: '1.05rem',
          lineHeight: 1.6,
        }}
      >
        <Translate id="homepage.subtitle">
          Estado duravel, WIP=1, evidencia objetiva e handoff entre sessoes
          para projetos OpenCode.
        </Translate>
      </p>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <a
          className="button button--primary button--lg"
          href="/opencode-harness-guide/docs/getting-started/installation"
          style={{ padding: '0.6rem 1.4rem' }}
        >
          <Translate id="homepage.cta.start">Começar agora</Translate>
        </a>
        <a
          className="button button--outline button--lg"
          href="/opencode-harness-guide/docs/concepts/prevc"
          style={{ padding: '0.6rem 1.4rem', borderColor: 'var(--border-color)' }}
        >
          <Translate id="homepage.cta.prevc">Entender PREVC</Translate>
        </a>
      </div>
    </header>
  );
}

function BenefitCard({
  step,
  title,
  description,
  accentColor,
}: {
  step: string;
  title: string;
  description: string;
  accentColor: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface-container)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--ifm-global-radius)',
        padding: '1.5rem',
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: accentColor,
          marginBottom: '0.5rem',
        }}
      >
        {step}
      </p>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
        {description}
      </p>
    </div>
  );
}

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  const cards = [
    {
      step: translate({ id: 'homepage.card1.step', message: '01 / ESTADO DURAVEL' }),
      title: translate({
        id: 'homepage.card1.title',
        message: 'Cada sessao sabe onde parou',
      }),
      description: translate({
        id: 'homepage.card1.description',
        message:
          'Arquivos de progresso, handoff e feature state garantem que a proxima sessao continue sem redescobrir o projeto do zero.',
      }),
      accentColor: 'var(--ifm-color-primary)',
    },
    {
      step: translate({ id: 'homepage.card2.step', message: '02 / EVIDENCIA' }),
      title: translate({
        id: 'homepage.card2.title',
        message: 'Conclusao exige prova, nao confianca',
      }),
      description: translate({
        id: 'homepage.card2.description',
        message:
          'Tres camadas de verificacao (estatica, runtime, sistema) antes de marcar qualquer tarefa como concluida.',
      }),
      accentColor: 'var(--color-accent-blue)',
    },
    {
      step: translate({ id: 'homepage.card3.step', message: '03 / HANDOFF' }),
      title: translate({
        id: 'homepage.card3.title',
        message: 'Encerre sem perder o contexto',
      }),
      description: translate({
        id: 'homepage.card3.description',
        message:
          'Toda sessao produz um handoff limpo com o que foi feito, o que quebrou e a unica proxima acao.',
      }),
      accentColor: 'var(--color-accent-violet)',
    },
  ];

  return (
    <Layout
      title={siteConfig.title}
      description={translate({
        id: 'homepage.meta.description',
        message:
          'Documentacao do workflow Harness OpenCode: planeje, execute e verifique trabalho com agentes OpenCode em varias sessoes.',
      })}
    >
      <HomepageHeader />

      <main
        style={{
          padding: '3rem 2rem',
          maxWidth: 960,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {cards.map((card) => (
            <BenefitCard
              key={card.step}
              step={card.step}
              title={card.title}
              description={card.description}
              accentColor={card.accentColor}
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}
