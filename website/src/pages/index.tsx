import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

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
        Controlled Agent Workflow
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
        Trabalho de agentes que voce consegue retomar, verificar e auditar.
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
        Estado duravel, WIP=1, evidencia objetiva e handoff entre sessoes
        para projetos OpenCode.
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
          Começar agora
        </a>
        <a
          className="button button--outline button--lg"
          href="/opencode-harness-guide/docs/concepts/prevc"
          style={{ padding: '0.6rem 1.4rem', borderColor: 'var(--border-color)' }}
        >
          Entender PREVC
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

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description="Documentacao do workflow Harness OpenCode: planeje, execute e verifique trabalho com agentes OpenCode em varias sessoes."
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
          <BenefitCard
            step="01 / ESTADO DURAVEL"
            title="Cada sessao sabe onde parou"
            description="Arquivos de progresso, handoff e feature state garantem que a proxima sessao continue sem redescobrir o projeto do zero."
            accentColor="var(--ifm-color-primary)"
          />
          <BenefitCard
            step="02 / EVIDENCIA"
            title="Conclusao exige prova, nao confianca"
            description="Tres camadas de verificacao (estatica, runtime, sistema) antes de marcar qualquer tarefa como concluida."
            accentColor="var(--color-accent-blue)"
          />
          <BenefitCard
            step="03 / HANDOFF"
            title="Encerre sem perder o contexto"
            description="Toda sessao produz um handoff limpo com o que foi feito, o que quebrou e a unica proxima acao."
            accentColor="var(--color-accent-violet)"
          />
        </div>
      </main>
    </Layout>
  );
}
