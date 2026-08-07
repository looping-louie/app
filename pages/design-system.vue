<script setup lang="ts">
import UiMainNavigation from '~/components/navigation/MainNavigation.vue'
import UiSiteFooter from '~/components/site/SiteFooter.vue'
import UiAccordion from '~/components/ui/Accordion.vue'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCollectionGroupTitle from '~/components/ui/CollectionGroupTitle.vue'
import UiContainer from '~/components/ui/Container.vue'
import UiGrid from '~/components/ui/Grid.vue'
import UiGridList from '~/components/ui/GridList.vue'
import UiHeadingBlock from '~/components/ui/HeadingBlock.vue'
import UiInterfaceShowcase from '~/components/ui/InterfaceShowcase.vue'
import UiSection from '~/components/ui/Section.vue'
import UiSectionStage from '~/components/ui/SectionStage.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'

definePageMeta({
  layout: false,
  alias: '/design-variants',
})

useHead({
  title: 'Design system · Looping Louie',
  meta: [
    {
      name: 'description',
      content: 'Looping Louie components, foundations, and visual patterns.',
    },
    { name: 'theme-color', content: '#fafbfc' },
  ],
})

const deployment = ref('cloud')
const environment = ref('production')
const catalog = ref('models')
const settings = ref('api-keys')
const headingDeployment = ref('platform')
const interfaceView = ref('agents')
const copiedCommand = ref<string | null>(null)
const copyError = ref<string | null>(null)
let copyResetTimer: ReturnType<typeof setTimeout> | undefined

const deploymentOptions = [
  { value: 'cloud', label: 'Louie Cloud' },
  { value: 'self-hosted', label: 'Self-hosted' },
]

const environmentOptions = [
  { value: 'preview', label: 'Preview' },
  { value: 'production', label: 'Production' },
]

const catalogOptions = [
  { value: 'providers', label: 'Providers' },
  { value: 'models', label: 'Models' },
  { value: 'skills', label: 'Skills' },
  { value: 'personas', label: 'Personas' },
  { value: 'loops', label: 'Loops' },
]

const settingsOptions = [
  { value: 'api-keys', label: 'API keys' },
  { value: 'mcps', label: 'MCPs' },
  { value: 'providers', label: 'Providers' },
]

const headingDeploymentOptions = [
  { value: 'platform', label: 'Louie Cloud' },
  { value: 'self-hosted', label: 'Self-hosted' },
]

const mainNavigationMenus = [
  {
    label: 'Product',
    sections: [
      {
        label: 'Open source',
        items: [
          { label: 'Framework', description: 'Build loops and agent teams', mark: '✣', to: '#site-navigation' },
        ],
      },
      {
        label: 'Platform',
        items: [
          { label: 'Observability', description: 'Metrics, logs, and traces', mark: '◉', to: '#site-navigation' },
          { label: 'Studio', description: 'Collaborate and evaluate', mark: '⌘', to: '#site-navigation' },
          { label: 'Builder', description: 'Create teams visually', mark: '⌁', to: '#site-navigation' },
          { label: 'Server', description: 'Deploy Louie anywhere', mark: '↻', to: '#site-navigation' },
        ],
      },
    ],
  },
  {
    label: 'Resources',
    sections: [
      {
        label: 'Get started',
        items: [
          { label: 'Quickstart', description: 'Launch your first loop', mark: '↗', to: '#site-navigation' },
          { label: 'Templates', description: 'Ready-made flight plans', mark: '▦', to: '#site-navigation' },
        ],
      },
      {
        label: 'Learn',
        items: [
          { label: 'Articles', description: 'Patterns from the hangar', mark: '≡', to: '#site-navigation' },
          { label: 'Changelog', description: 'Every nut and bolt', mark: '＋', to: '#site-navigation' },
        ],
      },
    ],
  },
]

const mainNavigationLinks = [
  { label: 'Pricing', to: '#site-navigation' },
  { label: 'Customers', to: '#site-navigation' },
  { label: 'Docs', to: '#site-navigation' },
]

const interfaceTabs = [
  { value: 'agents', label: 'Agents', mark: '✣', description: 'Configure specialist agents, tools, models, and instructions in one clear workspace.' },
  { value: 'workflows', label: 'Workflows', mark: '⌘', description: 'Compose typed steps, branches, retries, and human checkpoints into inspectable flows.' },
  { value: 'harness', label: 'Harness', mark: '⌁', description: 'Coordinate multiple modes and specialists around shared state and a single objective.' },
  { value: 'memory', label: 'Memory', mark: '◌', description: 'Give every loop durable context, semantic recall, and thread-aware storage.' },
  { value: 'server', label: 'Server', mark: '↻', description: 'Register projects once, run them locally, and deploy the same system wherever it belongs.' },
]

const interfaceScreens: Record<string, {
  file: string
  title: string
  navigation: string[]
  code: string[]
  status: string
}> = {
  agents: {
    file: 'agent.ts',
    title: 'Weather specialist',
    navigation: ['Chat', 'Tools', 'Review'],
    code: ['new Agent({', '  model: cockpitModel,', '  tools: { weather },', '})'],
    status: 'Ready for takeoff',
  },
  workflows: {
    file: 'workflow.ts',
    title: 'Order fulfilment',
    navigation: ['Graph', 'Runs', 'Checkpoints'],
    code: ['createWorkflow()', '  .then(validate)', '  .branch(route)', '  .commit()'],
    status: '4 steps connected',
  },
  harness: {
    file: 'harness.ts',
    title: 'Build crew',
    navigation: ['Modes', 'Threads', 'Storage'],
    code: ['new Harness({', '  modes: crewModes,', '  storage: hangar,', '})'],
    status: '3 specialists online',
  },
  memory: {
    file: 'memory.ts',
    title: 'Flight memory',
    navigation: ['Threads', 'Recall', 'Observations'],
    code: ['new Memory({', '  lastMessages: 20,', '  semanticRecall: true,', '})'],
    status: 'Context synchronized',
  },
  server: {
    file: 'server.ts',
    title: 'Louie Cloud',
    navigation: ['Routes', 'Deployments', 'Logs'],
    code: ['new LouieServer({', '  loops: flightCrew,', '  port: 4111,', '})'],
    status: 'Healthy · eu-west',
  },
}

const footerColumns = [
  { label: 'Framework', links: [{ label: 'Loops', to: '#site-footer' }, { label: 'Teams', to: '#site-footer' }, { label: 'Tasks', to: '#site-footer' }, { label: 'Observability', to: '#site-footer' }] },
  { label: 'Product', links: [{ label: 'Platform', to: '#site-footer' }, { label: 'Studio', to: '#site-footer' }, { label: 'Human review', to: '#site-footer' }, { label: 'Server', to: '#site-footer' }] },
  { label: 'Developers', links: [{ label: 'Docs', to: '#site-footer' }, { label: 'Changelog', to: '#site-footer' }, { label: 'Templates', to: '#site-footer' }, { label: 'API reference', to: '#site-footer' }] },
  { label: 'Resources', links: [{ label: 'Articles', to: '#site-footer' }, { label: 'Research', to: '#site-footer' }, { label: 'Guides', to: '#site-footer' }, { label: 'Flight manual', to: '#site-footer' }] },
  { label: 'Company', links: [{ label: 'About', to: '#site-footer' }, { label: 'Customers', to: '#site-footer' }, { label: 'Careers', to: '#site-footer' }, { label: 'Contact', to: '#site-footer' }] },
  { label: 'Connect', links: [{ label: 'GitHub', to: '#site-footer' }, { label: 'Discord', to: '#site-footer' }, { label: 'YouTube', to: '#site-footer' }, { label: 'X (Twitter)', to: '#site-footer' }] },
]

const footerLegalLinks = [
  { label: 'Privacy', to: '/legal/privacy' },
  { label: 'Terms', to: '/legal/terms' },
  { label: 'Imprint', to: '/legal/imprint' },
]

const customerRows = [
  { id: 'northstar', name: 'Northstar AI', categories: 'AI · Coding agent', to: '#grid-list' },
  { id: 'airframe', name: 'Airframe', categories: 'AI · Infrastructure', to: '#grid-list' },
  { id: 'runway', name: 'Runway Labs', categories: 'FinTech · Enterprise', to: '#grid-list' },
  { id: 'hangar', name: 'Hangar Cloud', categories: 'AI · Infrastructure', to: '#grid-list' },
]

const jobRows = [
  { id: 'product-designer', name: 'Product Designer', categories: 'Growth · Remote · Full-time', to: '#grid-list' },
  { id: 'product-engineer', name: 'Product Engineer', categories: 'Engineering · Remote · Full-time', to: '#grid-list' },
]

const teamMembers = [
  { id: 'maya', initials: 'MR', name: 'Maya Rivera', role: 'Founder & CEO' },
  { id: 'theo', initials: 'TC', name: 'Theo Chen', role: 'Founding Engineer' },
  { id: 'ines', initials: 'IA', name: 'Inés Álvarez', role: 'Product Designer' },
  { id: 'omar', initials: 'OS', name: 'Omar Silva', role: 'Customer Engineer' },
  { id: 'nora', initials: 'NK', name: 'Nora Kim', role: 'AI Engineer' },
  { id: 'leo', initials: 'LM', name: 'Leo Martin', role: 'Developer Relations' },
]

const faqItems = [
  {
    id: 'loop',
    title: 'What is a loop?',
    content: 'A loop coordinates generation, review, scoring, and retries until an output meets the quality threshold you define.',
  },
  {
    id: 'models',
    title: 'Can a loop use different models?',
    content: 'Yes. Each role can use its own provider and model, so the generator, reviewers, and aggregator do not have to share a cockpit.',
  },
  {
    id: 'people',
    title: 'Can people intervene while a loop is running?',
    content: 'Human checkpoints can pause execution, request a decision, and resume the same run with the new context attached.',
  },
  {
    id: 'hosting',
    title: 'Can Looping Louie be self-hosted?',
    content: 'The deployment model is independent from the interface. A project can run in Louie Cloud or in infrastructure controlled by your team.',
  },
]

async function copyToClipboard(command: string) {
  try {
    await navigator.clipboard.writeText(command)
    copiedCommand.value = command
    copyError.value = null
  } catch {
    copiedCommand.value = null
    copyError.value = command
  }

  if (copyResetTimer) clearTimeout(copyResetTimer)
  copyResetTimer = setTimeout(() => {
    copiedCommand.value = null
    copyError.value = null
  }, 1800)
}

function copyButtonLabel(command: string) {
  if (copiedCommand.value === command) return `Copied: ${command}`
  if (copyError.value === command) return `Could not copy: ${command}`
  return `Copy command: ${command}`
}

onBeforeUnmount(() => {
  if (copyResetTimer) clearTimeout(copyResetTimer)
})
</script>

<template>
  <div class="design-system-page">
    <header class="ds-header">
      <UiContainer size="default" class="ds-header__container">
        <NuxtLink to="/" class="ds-brand" aria-label="Back to Looping Louie">
          <img class="ds-brand__mark" src="/brand/twemoji-small-airplane.svg" alt="" width="28" height="28">
          <span>Looping Louie</span>
        </NuxtLink>

        <div class="ds-header__meta">
          <span class="ds-version">Design system · 0.1</span>
          <NuxtLink to="/" class="ds-header__link">Back to website</NuxtLink>
          <UiButton to="/app" variant="stroke" size="sm">Open app</UiButton>
        </div>
      </UiContainer>
    </header>

    <main>
      <UiSection as="div" space="none" class="ds-page-canvas">
        <section class="ds-hero">
        <div class="ds-hero__copy">
          <p class="ds-eyebrow"><span /> Foundations</p>
          <h1>Professional.<br><em>With one loose propeller.</em></h1>
          <p class="ds-hero__description">
            The first version of Looping Louie’s visual language. Clear, technical, and restrained;
            with just enough room for Louie to fly across the interface without taking the controls.
          </p>
        </div>

        <div class="ds-hero__preview" aria-label="Action preview">
          <div class="ds-preview-window">
            <div class="ds-preview-window__topbar">
              <span />
              <span />
              <span />
              <small>quickstart.ll</small>
            </div>
            <div class="ds-preview-window__body">
              <p class="ds-preview-window__label">Your first loop takes off here</p>
              <UiButton
                class="ds-command-button"
                variant="stroke"
                size="lg"
                :aria-label="copyButtonLabel('npm create looping-louie')"
                @click="copyToClipboard('npm create looping-louie')"
              >
                <code>npm create looping-louie</code>
                <template #trailing>
                  <svg v-if="copiedCommand === 'npm create looping-louie'" viewBox="0 0 20 20" fill="none">
                    <path d="m4.5 10.2 3.3 3.3 7.7-7.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else viewBox="0 0 20 20" fill="none">
                    <rect x="6.5" y="6.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                    <path d="M13.5 6.5v-1A1.5 1.5 0 0 0 12 4H5.5A1.5 1.5 0 0 0 4 5.5V12a1.5 1.5 0 0 0 1.5 1.5h1" stroke="currentColor" stroke-width="1.5" />
                  </svg>
                </template>
              </UiButton>
              <div class="ds-preview-window__actions">
                <UiButton size="sm">Create project</UiButton>
                <UiButton variant="stroke" size="sm">Documentation</UiButton>
              </div>
            </div>
          </div>
        </div>
        </section>

        <UiContainer size="wide" class="ds-shell-frame">
          <div class="ds-shell">
        <aside class="ds-sidebar" aria-label="Design system index">
          <p>Contents</p>
          <nav>
            <a href="#foundations" class="is-active">01 · Foundations</a>
            <a href="#colors">Color</a>
            <a href="#typography">Typography</a>
            <a href="#actions">02 · Actions</a>
            <a href="#buttons">Buttons</a>
            <a href="#copy-command">Copyable command</a>
            <a href="#segmented-control">Segmented control</a>
            <a href="#composition">03 · Composition</a>
            <a href="#heading-block">Heading block</a>
            <a href="#layout">04 · Layout</a>
            <a href="#container">Container</a>
            <a href="#section">Section</a>
            <a href="#collections">05 · Collections</a>
            <a href="#grid-card">Grid &amp; card</a>
            <a href="#grid-list">Grid list</a>
            <a href="#team-grid">Team grid</a>
            <a href="#accordion">Accordion</a>
            <a href="#site-chrome">06 · Site chrome</a>
            <a href="#site-navigation">Main navigation</a>
            <a href="#interface-showcase">Interface showcase</a>
            <a href="#site-footer">Site footer</a>
          </nav>
          <div class="ds-sidebar__note">
            <span class="ds-sidebar__note-dot" />
            <p>Components ready for progressive adoption across the application.</p>
          </div>
        </aside>

        <div class="ds-content">
          <section id="foundations" class="ds-section ds-section--foundations">
            <div class="ds-section__heading">
              <p class="ds-index">01</p>
              <div>
                <h2>Foundations</h2>
                <p>
                  Louie’s fuselage turned into a system: Metal neutrals, brand red,
                  action blue, and technical typography that does not need a helmet.
                </p>
              </div>
            </div>

            <article id="colors" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Color</h3>
                    <code>Twemoji 2.0</code>
                  </div>
                  <p>Original Small Airplane colors and derived tones for the interface.</p>
                </div>
                <span class="ds-status"><i /> Defined</span>
              </header>

              <div class="ds-palette">
                <div class="ds-palette__group">
                  <p>Text and surfaces</p>
                  <div class="ds-swatches">
                    <div class="ds-swatch ds-swatch--metal-950"><span>Metal 950 · Ink</span><code>#292F33</code></div>
                    <div class="ds-swatch ds-swatch--metal-700"><span>Metal 700 · Text Muted</span><code>#66757F</code></div>
                    <div class="ds-swatch ds-swatch--metal-500"><span>Metal 500 · Border Strong</span><code>#CCD6DD</code></div>
                    <div class="ds-swatch ds-swatch--metal-400"><span>Metal 400 · Divider</span><code>#DCE3E7</code></div>
                    <div class="ds-swatch ds-swatch--metal-200"><span>Metal 200 · Highlight</span><code>#EEF2F4</code></div>
                    <div class="ds-swatch ds-swatch--metal-100"><span>Metal 100 · Card</span><code>#F5F7F8</code></div>
                    <div class="ds-swatch ds-swatch--metal-050"><span>Metal 050 · Canvas</span><code>#FAFBFC</code></div>
                    <div class="ds-swatch ds-swatch--metal-025"><span>Metal 025 · Section</span><code>#FDFEFE</code></div>
                  </div>
                </div>

                <div class="ds-palette__group">
                  <p>Identity and action</p>
                  <div class="ds-swatches ds-swatches--brand">
                    <div class="ds-swatch ds-swatch--red-700"><span>Louie Red</span><code>#BE1931</code></div>
                    <div class="ds-swatch ds-swatch--red-500"><span>Louie Coral</span><code>#EA596E</code></div>
                    <div class="ds-swatch ds-swatch--blue-700"><span>Cockpit Blue</span><code>#226699</code></div>
                    <div class="ds-swatch ds-swatch--blue-300"><span>Sky Highlight</span><code>#9BC7E3</code></div>
                  </div>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>Rule</span>
                <p>Blue for primary actions, red for identity and emphasis; Metal builds the entire interface.</p>
              </footer>
            </article>

            <article id="typography" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Typography</h3>
                    <code>Instrument Sans + Commit Mono</code>
                  </div>
                  <p>A free pairing inspired by Mastra’s editorial and technical combination.</p>
                </div>
                <span class="ds-status"><i /> Self-hosted</span>
              </header>

              <div class="ds-type-specimens">
                <div class="ds-type-specimen ds-type-specimen--sans">
                  <div class="ds-type-specimen__meta">
                    <span>Instrument Sans</span>
                    <code>Display · Body · UI</code>
                  </div>
                  <p>Agents that stay on course.</p>
                  <small>Precise and compact, with just enough personality to keep the interface from looking like a tax return.</small>
                </div>

                <div class="ds-type-specimen ds-type-specimen--mono">
                  <div class="ds-type-specimen__meta">
                    <span>Commit Mono</span>
                    <code>Code · Metadata</code>
                  </div>
                  <p>npm create looping-louie</p>
                  <small>0123456789 · status: ready · altitude: 10,000 ft</small>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>License</span>
                <p>Both families use the SIL Open Font License 1.1 and are served from the project itself.</p>
              </footer>
            </article>
          </section>

          <section id="actions" class="ds-section">
            <div class="ds-section__heading">
              <p class="ds-index">02</p>
              <div>
                <h2>Actions</h2>
                <p>
                  Controls for starting, choosing, or copying. They share geometry and motion,
                  while each retains a clear responsibility.
                </p>
              </div>
            </div>

            <article id="buttons" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Button</h3>
                    <code>UiButton</code>
                  </div>
                  <p>Actions and links with three levels of hierarchy.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-stage ds-stage--buttons">
                <UiButton variant="primary" size="md">Create loop</UiButton>
                <UiButton variant="secondary">View documentation</UiButton>
                <UiButton variant="stroke">Cancel</UiButton>
              </div>

              <div class="ds-properties">
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Variants</span>
                    <code>variant</code>
                  </div>
                  <div class="ds-property__demo">
                    <UiButton variant="primary" size="sm">Primary</UiButton>
                    <UiButton variant="secondary" size="sm">Secondary</UiButton>
                    <UiButton variant="stroke" size="sm">Stroke</UiButton>
                    <UiButton variant="metal" size="sm">Metal 950</UiButton>
                  </div>
                </div>

                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Sizes</span>
                    <code>size</code>
                  </div>
                  <div class="ds-property__demo ds-property__demo--baseline">
                    <UiButton size="sm">Small</UiButton>
                    <UiButton size="md">Medium</UiButton>
                    <UiButton size="lg">Large</UiButton>
                  </div>
                </div>

                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>States</span>
                    <code>loading · disabled</code>
                  </div>
                  <div class="ds-property__demo">
                    <UiButton loading>Saving</UiButton>
                    <UiButton variant="secondary" disabled>Unavailable</UiButton>
                    <UiButton variant="secondary">
                      Continue
                      <template #trailing>
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M3 8h10m-4-4 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </template>
                    </UiButton>
                  </div>
                </div>
              </div>

              <div class="ds-context">
                <div class="ds-context__intro">
                  <span>In context</span>
                  <p>The hierarchy must continue to work within a real composition.</p>
                </div>
                <div class="ds-pricing-grid">
                  <div class="ds-plan-card">
                    <p class="ds-plan-card__name">Starter</p>
                    <p class="ds-plan-card__description">For loops that still need training wheels.</p>
                    <p class="ds-plan-card__price">0 € <span>/ month</span></p>
                    <UiButton variant="secondary" block>Get started free</UiButton>
                  </div>
                  <div class="ds-plan-card ds-plan-card--featured">
                    <span class="ds-plan-card__badge">Recommended</span>
                    <p class="ds-plan-card__name">Flight crew</p>
                    <p class="ds-plan-card__description">For teams running Louie in production.</p>
                    <p class="ds-plan-card__price">49 € <span>/ month</span></p>
                    <UiButton block>Choose Flight crew</UiButton>
                  </div>
                </div>
              </div>
            </article>

            <article id="copy-command" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Button with icon</h3>
                    <code>UiButton</code>
                  </div>
                  <p>The button presents the action; the page decides what happens when it is pressed.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-stage ds-stage--command">
                <div>
                  <span class="ds-stage__caption">Quick install</span>
                  <UiButton
                    class="ds-command-button"
                    variant="stroke"
                    size="lg"
                    :aria-label="copyButtonLabel('npm create looping-louie')"
                    @click="copyToClipboard('npm create looping-louie')"
                  >
                    <code>npm create looping-louie</code>
                    <template #trailing>
                      <svg v-if="copiedCommand === 'npm create looping-louie'" viewBox="0 0 20 20" fill="none">
                        <path d="m4.5 10.2 3.3 3.3 7.7-7.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <svg v-else viewBox="0 0 20 20" fill="none">
                        <rect x="6.5" y="6.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                        <path d="M13.5 6.5v-1A1.5 1.5 0 0 0 12 4H5.5A1.5 1.5 0 0 0 4 5.5V12a1.5 1.5 0 0 0 1.5 1.5h1" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </template>
                  </UiButton>
                </div>
                <div>
                  <span class="ds-stage__caption">Initialize a project</span>
                  <UiButton
                    class="ds-command-button"
                    variant="stroke"
                    size="lg"
                    :aria-label="copyButtonLabel('npx looping-louie init --with-propeller')"
                    @click="copyToClipboard('npx looping-louie init --with-propeller')"
                  >
                    <code>npx looping-louie init --with-propeller</code>
                    <template #trailing>
                      <svg v-if="copiedCommand === 'npx looping-louie init --with-propeller'" viewBox="0 0 20 20" fill="none">
                        <path d="m4.5 10.2 3.3 3.3 7.7-7.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <svg v-else viewBox="0 0 20 20" fill="none">
                        <rect x="6.5" y="6.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5" />
                        <path d="M13.5 6.5v-1A1.5 1.5 0 0 0 12 4H5.5A1.5 1.5 0 0 0 4 5.5V12a1.5 1.5 0 0 0 1.5 1.5h1" stroke="currentColor" stroke-width="1.5" />
                      </svg>
                    </template>
                  </UiButton>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>Responsibility</span>
                <p>The page controls the clipboard and passes the button its label, content, icon, and visual state.</p>
              </footer>
              <p class="ds-sr-status" aria-live="polite">
                {{ copiedCommand ? `Command copied: ${copiedCommand}` : copyError ? `Could not copy: ${copyError}` : '' }}
              </p>
            </article>

            <article id="segmented-control" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Segmented control</h3>
                    <code>UiSegmentedControl</code>
                  </div>
                  <p>A single choice among related options, not two buttons competing.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-stage ds-stage--segments">
                <section class="ds-segment-variant" aria-labelledby="contained-variant-title">
                  <header class="ds-segment-variant__header">
                    <div>
                      <span>Variant 01</span>
                      <h4 id="contained-variant-title">Contained</h4>
                    </div>
                    <code>variant="contained"</code>
                  </header>
                  <p class="ds-segment-variant__description">
                    A compact track that groups a small set of closely related choices.
                  </p>
                  <div class="ds-segment-variant__examples">
                    <div class="ds-segment-example">
                      <span class="ds-stage__caption">Deployment</span>
                      <UiSegmentedControl
                        v-model="deployment"
                        :options="deploymentOptions"
                        accent="metal"
                        aria-label="Deployment type"
                      />
                      <small>Selected: {{ deployment }}</small>
                    </div>
                    <div class="ds-segment-example">
                      <span class="ds-stage__caption">Environment</span>
                      <UiSegmentedControl
                        v-model="environment"
                        :options="environmentOptions"
                        accent="primary"
                        aria-label="Execution environment"
                      />
                      <small>Selected: {{ environment }}</small>
                    </div>
                  </div>
                </section>

                <section class="ds-segment-variant" aria-labelledby="inline-variant-title">
                  <header class="ds-segment-variant__header">
                    <div>
                      <span>Variant 02</span>
                      <h4 id="inline-variant-title">Inline</h4>
                    </div>
                    <code>variant="inline"</code>
                  </header>
                  <p class="ds-segment-variant__description">
                    A lightweight navigation row for broader sets of peer destinations.
                  </p>
                  <div class="ds-segment-variant__examples">
                    <div class="ds-segment-example">
                      <span class="ds-stage__caption">Catalog</span>
                      <UiSegmentedControl
                        v-model="catalog"
                        :options="catalogOptions"
                        variant="inline"
                        accent="metal"
                        aria-label="Catalog section"
                      />
                      <small>Selected: {{ catalog }}</small>
                    </div>
                    <div class="ds-segment-example">
                      <span class="ds-stage__caption">Settings</span>
                      <UiSegmentedControl
                        v-model="settings"
                        :options="settingsOptions"
                        variant="inline"
                        accent="primary"
                        aria-label="Settings section"
                      />
                      <small>Selected: {{ settings }}</small>
                    </div>
                  </div>
                </section>
              </div>

              <footer class="ds-component__footnote">
                <span>Keyboard</span>
                <p>Supports arrow keys, Home, and End following the accessible pattern for a group of options.</p>
              </footer>
            </article>
          </section>

          <section id="composition" class="ds-section">
            <div class="ds-section__heading">
              <p class="ds-index">03</p>
              <div>
                <h2>Composition</h2>
                <p>
                  Reusable arrangements for introducing pages and sections. The structure stays
                  consistent while each page owns its copy, controls, and behaviour.
                </p>
              </div>
            </div>

            <article id="heading-block" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Heading block</h3>
                    <code>UiHeadingBlock</code>
                  </div>
                  <p>Page and section introductions with centered or split composition.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-heading-cases">
                <section class="ds-heading-case">
                  <header class="ds-heading-case__meta">
                    <div>
                      <span>Centered · Hero</span>
                      <p>Use for a page hero that needs context, explanation, and primary actions.</p>
                    </div>
                    <code>layout="centered" · size="hero"</code>
                  </header>
                  <div class="ds-heading-case__preview ds-heading-case__preview--hero">
                    <UiHeadingBlock layout="centered" size="hero">
                      <template #eyebrow>Agent observability</template>
                      <template #title>
                        <h2>Every loop, fully visible in production</h2>
                      </template>
                      <template #description>
                        <p>
                          Follow every model call, retry, and human handoff without adding another
                          dashboard to the cockpit.
                        </p>
                      </template>
                      <template #actions>
                        <UiButton>Get started</UiButton>
                        <UiButton variant="stroke">Documentation</UiButton>
                      </template>
                    </UiHeadingBlock>
                  </div>
                </section>

                <section class="ds-heading-case">
                  <header class="ds-heading-case__meta">
                    <div>
                      <span>Centered · Statement</span>
                      <p>Use between sections when the heading itself is the entire message.</p>
                    </div>
                    <code>layout="centered" · size="section"</code>
                  </header>
                  <div class="ds-heading-case__preview ds-heading-case__preview--statement">
                    <UiHeadingBlock layout="centered" size="section">
                      <template #title>
                        <h2>
                          Loops. Skills. Personas.
                          <span>Louie brings the whole flight crew.</span>
                        </h2>
                      </template>
                    </UiHeadingBlock>
                  </div>
                </section>

                <section class="ds-heading-case">
                  <header class="ds-heading-case__meta">
                    <div>
                      <span>Split · With selector</span>
                      <p>Use when a page-level choice changes the content immediately below.</p>
                    </div>
                    <code>layout="split" · #aside</code>
                  </header>
                  <div class="ds-heading-case__preview">
                    <UiHeadingBlock layout="split" size="section">
                      <template #title>
                        <h2>Plans that scale with your loops</h2>
                      </template>
                      <template #aside>
                        <div class="ds-heading-aside">
                          <UiSegmentedControl
                            v-model="headingDeployment"
                            :options="headingDeploymentOptions"
                            accent="metal"
                            aria-label="Deployment model"
                          />
                        </div>
                      </template>
                    </UiHeadingBlock>
                  </div>
                </section>

                <section class="ds-heading-case">
                  <header class="ds-heading-case__meta">
                    <div>
                      <span>Split · With action</span>
                      <p>Use when the heading introduces a collection with one clear next step.</p>
                    </div>
                    <code>layout="split" · #aside</code>
                  </header>
                  <div class="ds-heading-case__preview">
                    <UiHeadingBlock layout="split" size="section">
                      <template #title>
                        <h2>Meet the teams flying with Louie</h2>
                      </template>
                      <template #aside>
                        <UiButton variant="stroke">Talk to the crew</UiButton>
                      </template>
                    </UiHeadingBlock>
                  </div>
                </section>

                <section class="ds-heading-case">
                  <header class="ds-heading-case__meta">
                    <div>
                      <span>Subsection · H3</span>
                      <p>Use for collection headings such as open positions, values, or team directories.</p>
                    </div>
                    <code>size="subsection" · h3</code>
                  </header>
                  <div class="ds-heading-case__preview ds-heading-case__preview--subsection">
                    <UiGrid :columns="2" gap="lg">
                      <UiHeadingBlock align="start" size="subsection">
                        <template #title><h3>Open positions</h3></template>
                      </UiHeadingBlock>
                      <UiHeadingBlock align="start" size="subsection">
                        <template #title><h3>The crew</h3></template>
                        <template #description>
                          <p>People building Looping Louie from hangars around the world.</p>
                        </template>
                      </UiHeadingBlock>
                    </UiGrid>
                  </div>
                </section>
              </div>

              <div class="ds-properties">
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Layout</span>
                    <code>layout</code>
                  </div>
                  <p class="ds-property__copy">
                    <strong>centered</strong> stacks content on one axis. <strong>split</strong>
                    reserves an independent aside column and stacks it below the title on mobile.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Scale</span>
                    <code>size</code>
                  </div>
                  <p class="ds-property__copy">
                    <strong>hero</strong> is reserved for the main page proposition.
                    <strong>section</strong> is the default for subsequent introductions, and
                    <strong>subsection</strong> introduces local collections with an h3.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Alignment</span>
                    <code>align</code>
                  </div>
                  <p class="ds-property__copy">
                    Defaults to <strong>center</strong> for centered layouts and <strong>start</strong>
                    for split layouts. Override only when the surrounding composition requires it.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Content</span>
                    <code>slots</code>
                  </div>
                  <p class="ds-property__copy">
                    Use <strong>eyebrow</strong>, <strong>title</strong>, <strong>description</strong>,
                    <strong>actions</strong>, and <strong>aside</strong> independently. Only title is
                    normally required; the page supplies the correct semantic heading level.
                  </p>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>Responsibility</span>
                <p>
                  The component controls rhythm, measure, and responsive layout. The consuming page
                  owns heading semantics, copy, controls, navigation, and click behaviour.
                </p>
              </footer>
            </article>
          </section>

          <section id="layout" class="ds-section">
            <div class="ds-section__heading">
              <p class="ds-index">04</p>
              <div>
                <h2>Layout</h2>
                <p>
                  Sections establish vertical rhythm, containers establish horizontal measure, and
                  stages add the optional tonal surface and inverse geometry.
                </p>
              </div>
            </div>

            <article id="container" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Container</h3>
                    <code>UiContainer</code>
                  </div>
                  <p>Consistent content measures and responsive page gutters.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-container-demos">
                <UiContainer size="reading" class="ds-container-demo">
                  <div>
                    <span>Reading</span>
                    <code>48rem</code>
                  </div>
                </UiContainer>
                <UiContainer size="default" class="ds-container-demo">
                  <div>
                    <span>Default</span>
                    <code>78rem</code>
                  </div>
                </UiContainer>
                <UiContainer size="wide" class="ds-container-demo">
                  <div>
                    <span>Wide</span>
                    <code>83rem</code>
                  </div>
                </UiContainer>
                <UiContainer size="full" class="ds-container-demo">
                  <div>
                    <span>Full</span>
                    <code>No maximum</code>
                  </div>
                </UiContainer>
              </div>

              <div class="ds-properties">
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Reading</span>
                    <code>size="reading"</code>
                  </div>
                  <p class="ds-property__copy">
                    Long-form copy, legal text, documentation, and any passage where comfortable
                    line length matters more than filling the available space.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Default</span>
                    <code>size="default"</code>
                  </div>
                  <p class="ds-property__copy">
                    Navigation, page headings, focused product content, and the majority of ordinary
                    page sections. This is the default when size is omitted.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Wide</span>
                    <code>size="wide"</code>
                  </div>
                  <p class="ds-property__copy">
                    Card grids, pricing tables, media, logo clouds, and compositions that benefit
                    from using more of the viewport without touching its edges.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Full</span>
                    <code>size="full"</code>
                  </div>
                  <p class="ds-property__copy">
                    Removes the maximum width but preserves responsive gutters. Omit the container
                    entirely when an image or background must be genuinely full-bleed.
                  </p>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>Gutters</span>
                <p>All sizes share fluid gutters from 18px on small screens to 24px on larger screens.</p>
              </footer>
            </article>

            <article id="section" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Section</h3>
                    <code>UiSection · UiSectionStage</code>
                  </div>
                  <p>Semantic page chapters separated from optional tonal stages and inverse edges.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-section-demos">
                <div class="ds-section-demo">
                  <div class="ds-section-demo__meta">
                    <span>Canvas section</span>
                    <code>UiSection · no stage</code>
                  </div>
                  <UiSection as="div" space="none">
                    <div class="ds-section-demo__sample">
                      <h4>A clean page chapter</h4>
                      <p>Without a stage, Section stays entirely on Canvas. Light 050 never appears implicitly.</p>
                    </div>
                  </UiSection>
                </div>

                <div class="ds-section-demo">
                  <div class="ds-section-demo__meta">
                    <span>Heading outside · regular stage</span>
                    <code>Section + Stage inverse="none"</code>
                  </div>
                  <UiSection as="div" space="none" class="ds-section-composition">
                    <div class="ds-section-demo__sample">
                      <h4>The title belongs to Canvas</h4>
                      <p>The stage starts afterwards, so the heading is not captured by its tonal background.</p>
                    </div>
                    <UiSectionStage>
                      <div class="ds-section-demo__sample ds-section-demo__sample--stage">
                        <p>Light 050 begins here, with regular rounded edges.</p>
                      </div>
                    </UiSectionStage>
                  </UiSection>
                </div>

                <div class="ds-section-demo">
                  <div class="ds-section-demo__meta">
                    <span>Inverse top</span>
                    <code>SectionStage inverse="top"</code>
                  </div>
                  <UiSection as="div" space="none">
                    <UiSectionStage inverse="top">
                      <div class="ds-section-demo__sample">
                        <h4>Arrive from the previous band</h4>
                        <p>The upper Light 050 band opens to full width while the lower edge remains contained.</p>
                      </div>
                    </UiSectionStage>
                  </UiSection>
                </div>

                <div class="ds-section-demo">
                  <div class="ds-section-demo__meta">
                    <span>Heading inside · inverse bottom</span>
                    <code>SectionStage inverse="bottom"</code>
                  </div>
                  <UiSection as="div" space="none">
                    <UiSectionStage inverse="bottom">
                      <div class="ds-section-demo__sample">
                        <h4>The title belongs to the collection</h4>
                        <p>Heading and content share Light 050 before the lower edge expands through its inverse radius.</p>
                      </div>
                    </UiSectionStage>
                  </UiSection>
                </div>

                <div class="ds-section-demo">
                  <div class="ds-section-demo__meta">
                    <span>Inverse top and bottom</span>
                    <code>SectionStage inverse="both"</code>
                  </div>
                  <UiSection as="div" space="none">
                    <UiSectionStage inverse="both">
                      <div class="ds-section-demo__sample">
                        <h4>A continuous tonal chapter</h4>
                        <p>Both Light 050 padding bands reach full width while Canvas remains visible at the sides.</p>
                      </div>
                    </UiSectionStage>
                  </UiSection>
                </div>
              </div>

              <div class="ds-properties">
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Section</span>
                    <code>space</code>
                  </div>
                  <p class="ds-property__copy">
                    Section is always Canvas and controls semantic grouping plus vertical rhythm.
                    Choose <strong>none</strong>, <strong>sm</strong>, <strong>md</strong>, or
                    <strong>lg</strong> for its fluid vertical spacing.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Stage surface</span>
                    <code>UiSectionStage</code>
                  </div>
                  <p class="ds-property__copy">
                    Stage is opt-in. It owns Light 050, the thin horizontal shell padding, and its
                    corner geometry. Put a heading inside only when it belongs to that visual group.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Stage edges</span>
                    <code>inverse</code>
                  </div>
                  <p class="ds-property__copy">
                    Choose <strong>none</strong>, <strong>top</strong>, <strong>bottom</strong>, or
                    <strong>both</strong>. Normal edges finish inside the shell; inverse edges expand
                    their vertical padding to the full width of the section.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Container</span>
                    <code>size</code>
                  </div>
                  <p class="ds-property__copy">
                    Container remains a measurement primitive. It controls maximum width and page
                    gutters, but never paints a surface or decides corner geometry.
                  </p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Stage shell</span>
                    <code>--ui-section-stage-shell-padding</code>
                  </div>
                  <p class="ds-property__copy">
                    The shell owns the thin padding band and the corner geometry. Its structural
                    radius is shared with cards and the main navigation dropdown: 30px on small
                    screens and 40px from 640px upwards, following Mastra’s antigrid radius. The
                    stage adds its shell inset to the outer SVG curve so its inner visual radius
                    remains identical.
                  </p>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>Composition</span>
                <p>
                  Section owns the chapter, Container owns measure, and SectionStage owns paint and
                  shape. Grid and GridList stay transparent and only distribute their content.
                </p>
              </footer>
            </article>
          </section>

          <section id="collections" class="ds-section">
            <div class="ds-section__heading">
              <p class="ds-index">05</p>
              <div>
                <h2>Collections</h2>
                <p>
                  Repeated content uses a small set of layout and surface primitives. The grid owns
                  distribution, the card owns presentation, and the page still owns the data.
                </p>
              </div>
            </div>

            <article id="grid-card" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Grid and card</h3>
                    <code>UiGrid · UiCard</code>
                  </div>
                  <p>Composable grids for visual features, editorial content, books, and releases.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-collection-example">
                <UiSection as="div" space="none" class="ds-collection-section">
                  <div class="ds-collection-example__heading ds-collection-example__heading--outside">
                    <span>Media cards</span>
                    <code>heading outside · columns="3" · variant="media"</code>
                  </div>
                  <UiSectionStage class="ds-collection-stage">
                    <UiGrid :columns="3" gap="md">
                      <UiCard to="#grid-card" variant="media">
                        <template #eyebrow>Use case</template>
                        <template #title><h4>Internal agents</h4></template>
                        <template #description><p>Automate the work that keeps your team circling the same runway.</p></template>
                        <template #media><div class="ds-media-visual ds-media-visual--messages" /></template>
                        <template #media-hover><div class="ds-media-visual ds-media-visual--messages is-animated" /></template>
                      </UiCard>
                      <UiCard to="#grid-card" variant="media">
                        <template #eyebrow>Use case</template>
                        <template #title><h4>Customer-facing agents</h4></template>
                        <template #description><p>Answer, complete tasks, and hand off without losing context.</p></template>
                        <template #media><div class="ds-media-visual ds-media-visual--signal" /></template>
                        <template #media-hover><div class="ds-media-visual ds-media-visual--signal is-animated" /></template>
                      </UiCard>
                      <UiCard to="#grid-card" variant="media">
                        <template #eyebrow>Use case</template>
                        <template #title><h4>Developer platform agents</h4></template>
                        <template #description><p>Build reliable AI operations on shared primitives.</p></template>
                        <template #media><div class="ds-media-visual ds-media-visual--console" /></template>
                        <template #media-hover><div class="ds-media-visual ds-media-visual--console is-animated" /></template>
                      </UiCard>
                    </UiGrid>
                  </UiSectionStage>
                </UiSection>
              </div>

              <div class="ds-collection-example">
                <UiSection as="div" space="none" class="ds-collection-section">
                  <div class="ds-collection-example__heading ds-collection-example__heading--outside">
                    <span>Agent books and latest releases</span>
                    <code>group titles outside Stage · content inside</code>
                  </div>
                  <div class="ds-grouped-collection">
                    <UiGrid :columns="2" gap="md" collapse="never" class="ds-grouped-collection__titles">
                      <UiCollectionGroupTitle title="Agent books" />
                      <UiCollectionGroupTitle title="Latest releases" to="#grid-card" />
                    </UiGrid>
                    <UiSectionStage inverse="bottom" class="ds-collection-stage ds-collection-stage--grouped">
                      <UiGrid :columns="2" gap="md" collapse="never">
                        <div class="ds-resource-group">
                          <UiCard to="#grid-card" variant="editorial">
                            <template #eyebrow>Field manual · Volume 01</template>
                            <template #title><h4>Principles of Building Reliable Loops</h4></template>
                            <template #description><p>A practical guide to agents that know when to take another lap.</p></template>
                            <template #meta>240K+ copies distributed</template>
                          </UiCard>
                        </div>
                        <div class="ds-resource-group ds-resource-group--releases">
                          <UiCard to="#grid-card" variant="row">
                            <template #title><h4>Human checkpoints</h4></template>
                            <template #description><p>Pause sensitive runs for review without losing execution context.</p></template>
                            <template #trailing><time datetime="2026-08-05">Aug 5</time></template>
                          </UiCard>
                          <UiCard to="#grid-card" variant="row">
                            <template #title><h4>Persistent loop memory</h4></template>
                            <template #description><p>Carry decisions and state across long-running agent workflows.</p></template>
                            <template #trailing><time datetime="2026-08-03">Aug 3</time></template>
                          </UiCard>
                        </div>
                      </UiGrid>
                    </UiSectionStage>
                  </div>
                </UiSection>
              </div>

              <div class="ds-collection-example">
                <UiSection as="div" space="none" class="ds-collection-section">
                  <div class="ds-collection-example__heading ds-collection-example__heading--outside">
                    <span>Articles</span>
                    <code>heading outside · columns="2" · variant="editorial"</code>
                  </div>
                  <UiSectionStage class="ds-collection-stage">
                    <UiGrid :columns="2" gap="md">
                      <UiCard to="#grid-card" variant="editorial">
                        <template #eyebrow>Engineering</template>
                        <template #title><h4>How to review long-running agents without slowing them down</h4></template>
                        <template #description><p>Patterns for parallel review, confidence thresholds, and useful retries.</p></template>
                        <template #meta>Aug 1, 2026</template>
                        <template #trailing><span># foundations</span></template>
                      </UiCard>
                      <UiCard to="#grid-card" variant="editorial">
                        <template #eyebrow>Architecture</template>
                        <template #title><h4>Choosing models for generators, reviewers, and aggregators</h4></template>
                        <template #description><p>Match model strengths to roles without turning configuration into archaeology.</p></template>
                        <template #meta>Jul 26, 2026</template>
                        <template #trailing><span># models</span></template>
                      </UiCard>
                    </UiGrid>
                  </UiSectionStage>
                </UiSection>
              </div>

              <div class="ds-properties">
                <div class="ds-property">
                  <div class="ds-property__label"><span>Grid</span><code>columns · gap</code></div>
                  <p class="ds-property__copy">Columns collapse from four or three to two, then to one. Grid never styles its children.</p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label"><span>Card</span><code>media · editorial · row</code></div>
                  <p class="ds-property__copy">Cards share surface, radius, and slots. Media cards crossfade to the optional hover layer on hover or keyboard focus.</p>
                </div>
              </div>
            </article>

            <article id="grid-list" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Grid list</h3>
                    <code>UiGridList</code>
                  </div>
                  <p>Aligned directory rows with leading, metadata, and trailing slots.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-collection-example ds-collection-example--directory">
                <UiSection as="div" space="none" class="ds-collection-section">
                  <div class="ds-collection-example__heading ds-collection-example__heading--outside">
                    <span>Customer directory</span>
                    <code>heading outside · Stage inverse="bottom" · GridList plain</code>
                  </div>
                  <UiSectionStage inverse="bottom" class="ds-collection-stage">
                    <UiGridList :items="customerRows" aria-label="Customer directory" clickable>
                      <template #leading="{ item }"><strong>{{ item.name }}</strong></template>
                      <template #metadata="{ item }">{{ item.categories }}</template>
                      <template #trailing><span class="ds-grid-list-link">Read story →</span></template>
                    </UiGridList>
                  </UiSectionStage>
                </UiSection>
              </div>

              <div class="ds-collection-example">
                <UiSection as="div" space="none" class="ds-collection-section">
                  <div class="ds-collection-example__heading ds-collection-example__heading--outside">
                    <span>Open positions</span>
                    <code>heading outside · GridList surface · clickable</code>
                  </div>
                  <UiSectionStage class="ds-collection-stage">
                    <UiGridList :items="jobRows" variant="surface" aria-label="Open positions" clickable>
                      <template #leading="{ item }"><strong>{{ item.name }}</strong></template>
                      <template #metadata="{ item }">{{ item.categories }}</template>
                      <template #trailing><UiButton as="span" variant="metal" size="sm">Apply</UiButton></template>
                    </UiGridList>
                  </UiSectionStage>
                </UiSection>
              </div>

              <footer class="ds-component__footnote">
                <span>Surface ownership</span>
                <p>GridList remains transparent and responsive. Its optional SectionStage owns Light 050 and any inverse edge; Section stays on Canvas.</p>
              </footer>
            </article>

            <article id="team-grid" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Team directory</h3>
                    <code>UiGrid</code>
                  </div>
                  <p>A directory is content inside the grid, not another card variant.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-collection-example">
                <UiSection as="div" space="none" class="ds-collection-section">
                  <div class="ds-collection-heading-outside">
                    <UiHeadingBlock align="start" size="subsection">
                      <template #title><h3>The crew</h3></template>
                      <template #description><p>Six people keeping Louie in the air from around the world.</p></template>
                    </UiHeadingBlock>
                  </div>
                  <UiSectionStage class="ds-collection-stage">
                    <UiGrid :columns="3" gap="lg" class="ds-team-grid">
                      <div v-for="member in teamMembers" :key="member.id" class="ds-team-member">
                        <span class="ds-team-member__avatar">{{ member.initials }}</span>
                        <div><strong>{{ member.name }}</strong><span>{{ member.role }}</span></div>
                      </div>
                    </UiGrid>
                  </UiSectionStage>
                </UiSection>
              </div>

              <footer class="ds-component__footnote">
                <span>Rule</span>
                <p>Use cards only when each person needs a bounded surface or richer interaction. A simple directory does not.</p>
              </footer>
            </article>

            <article id="accordion" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Accordion</h3>
                    <code>UiAccordion</code>
                  </div>
                  <p>Progressive disclosure for frequently asked questions and dense supporting content.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-collection-example ds-collection-example--accordion">
                <UiSection as="div" space="none" class="ds-collection-section">
                  <div class="ds-grouped-collection">
                    <UiCollectionGroupTitle
                      heading-as="h3"
                      title="Frequently Asked Questions"
                    />
                    <UiSectionStage inverse="bottom" class="ds-collection-stage">
                      <UiAccordion :items="faqItems" :default-open="['loop']" />
                    </UiSectionStage>
                  </div>
                </UiSection>
              </div>

              <footer class="ds-component__footnote">
                <span>Accessibility</span>
                <p>Triggers expose expanded state and control labelled regions. Reduced-motion preferences disable the transition.</p>
              </footer>
            </article>
          </section>

          <section id="site-chrome" class="ds-section">
            <div class="ds-section__heading">
              <p class="ds-index">06</p>
              <div>
                <h2>Site chrome</h2>
                <p>
                  The large compositional pieces around the product: animated navigation,
                  connected interface views, and the final footer island.
                </p>
              </div>
            </div>

            <article id="site-navigation" class="ds-component ds-component--navigation">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Main navigation</h3>
                    <code>UiMainNavigation</code>
                  </div>
                  <p>Data-driven dropdowns connected to a compact navigation bar.</p>
                </div>
                <span class="ds-status"><i /> Interactive</span>
              </header>

              <div class="ds-site-navigation-demo">
                <UiMainNavigation :menus="mainNavigationMenus" :links="mainNavigationLinks">
                  <template #brand>
                    <a href="#site-navigation" class="ds-site-brand">
                      <img src="/brand/twemoji-small-airplane.svg" alt="" width="26" height="26">
                      <strong>Looping Louie</strong>
                    </a>
                  </template>
                  <template #actions>
                    <UiButton variant="stroke" size="sm">Log in</UiButton>
                    <UiButton variant="metal" size="sm">Open app</UiButton>
                  </template>
                </UiMainNavigation>
                <div class="ds-site-navigation-demo__body">
                  <span>Hover Product or Resources</span>
                  <h4>A menu that opens like part of the page.</h4>
                  <p>The surface grows from the navigation bar while the content behind it recedes.</p>
                </div>
              </div>

              <div class="ds-properties">
                <div class="ds-property">
                  <div class="ds-property__label"><span>Content</span><code>menus · links · slots</code></div>
                  <p class="ds-property__copy">Menu sections and links come from the page. Brand and actions remain composable slots.</p>
                </div>
                <div class="ds-property">
                  <div class="ds-property__label"><span>Motion</span><code>180–240ms</code></div>
                  <p class="ds-property__copy">Opacity, vertical scale, radius, and the soft backdrop animate together from the top edge.</p>
                </div>
              </div>
            </article>

            <article id="interface-showcase" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Interface showcase</h3>
                    <code>UiInterfaceShowcase</code>
                  </div>
                  <p>Connected tabs for moving between related product interfaces.</p>
                </div>
                <span class="ds-status"><i /> Interactive</span>
              </header>

              <div class="ds-showcase-example">
                <UiInterfaceShowcase v-model="interfaceView" :tabs="interfaceTabs">
                  <template #panel="{ item }">
                    <div class="ds-interface-screen" :class="`ds-interface-screen--${item.value}`">
                      <div class="ds-interface-screen__code">
                        <header><span>{{ interfaceScreens[item.value]?.file }}</span><i /></header>
                        <pre><code><span v-for="line in interfaceScreens[item.value]?.code" :key="line">{{ line }}</span></code></pre>
                      </div>

                      <div class="ds-interface-screen__app">
                        <header>
                          <span /><span /><span />
                          <strong>{{ interfaceScreens[item.value]?.title }}</strong>
                        </header>
                        <div class="ds-interface-screen__app-body">
                          <nav>
                            <span
                              v-for="(entry, index) in interfaceScreens[item.value]?.navigation"
                              :key="entry"
                              :class="{ 'is-active': index === 0 }"
                            >{{ entry }}</span>
                          </nav>
                          <div class="ds-interface-screen__canvas">
                            <p>{{ interfaceScreens[item.value]?.status }}</p>
                            <div><span /><span /><span /></div>
                            <div><span /><span /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </UiInterfaceShowcase>
              </div>

              <footer class="ds-component__footnote">
                <span>Keyboard</span>
                <p>Arrow keys, Home, and End move between tabs. The page supplies the panel content through a scoped slot.</p>
              </footer>
            </article>

            <article id="site-footer" class="ds-component ds-component--site-footer">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Site footer</h3>
                    <code>UiSiteFooter</code>
                  </div>
                  <p>A composable footer placed inside a Section with an inverse-bottom edge.</p>
                </div>
                <span class="ds-status"><i /> Composable</span>
              </header>

              <div class="ds-site-footer-demo">
                <UiSiteFooter :columns="footerColumns" :legal-links="footerLegalLinks" status="All loops operational">
                  <template #brand>
                    <a href="#site-footer" class="ds-footer-brand">
                      <img src="/brand/twemoji-small-airplane.svg" alt="" width="34" height="34">
                      <strong>Looping Louie</strong>
                    </a>
                  </template>
                  <template #newsletter>
                    <form class="ds-footer-newsletter" @submit.prevent>
                      <label for="ds-footer-email">Get weekly flight notes</label>
                      <div>
                        <input id="ds-footer-email" type="email" placeholder="pilot@company.com">
                        <UiButton type="submit" variant="metal" size="sm">Subscribe</UiButton>
                      </div>
                    </form>
                  </template>
                </UiSiteFooter>
              </div>

              <footer class="ds-component__footnote">
                <span>Ownership</span>
                <p>Columns and legal links are data. Brand and newsletter are slots, so submission logic stays with the consuming page.</p>
              </footer>
            </article>
          </section>
        </div>
          </div>
        </UiContainer>
      </UiSection>
    </main>

    <footer class="ds-footer">
      <UiContainer size="default" class="ds-footer__container">
        <p>Looping Louie Design System</p>
        <span>Built to go in circles without making the user dizzy.</span>
      </UiContainer>
    </footer>
  </div>
</template>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}

:global(body) {
  margin: 0;
}

.design-system-page,
.design-system-page * {
  box-sizing: border-box;
}

.design-system-page {
  --ll-color-canvas: var(--ll-color-metal-050);

  min-height: 100vh;
  overflow-x: clip;
  color: var(--ll-color-text);
  background-color: var(--ll-color-canvas);
  font-family: var(--ll-font-sans);
  -webkit-font-smoothing: antialiased;
}

.ds-page-canvas {
  overflow: visible;
  background-color: var(--ll-color-canvas);
}

.ds-header {
  position: sticky;
  top: 0;
  z-index: 20;
  min-height: 4.25rem;
  background: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-header__container {
  display: flex;
  min-height: 4.25rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding-block: var(--ll-space-3);
}

.ds-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-3);
  color: var(--ll-color-ink);
  font-size: 0.9375rem;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: -0.01em;
}

.ds-brand__mark {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
}

.ds-header__meta {
  display: flex;
  align-items: center;
  gap: var(--ll-space-2);
}

.ds-version {
  margin-right: var(--ll-space-3);
  color: var(--ll-color-text-muted);
  font: 500 var(--ll-text-xs) / 1 var(--ll-font-mono);
}

.ds-header__link {
  padding: 0.65rem 0.75rem;
  color: var(--ll-color-text-muted);
  font-size: 0.90625rem;
  font-weight: 470;
  text-decoration: none;
}

.ds-header__link:hover {
  color: var(--ll-color-ink);
}

.ds-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(26rem, 0.92fr);
  min-height: 38rem;
  border-bottom: 1px solid var(--ll-color-border);
}

.ds-hero__copy,
.ds-hero__preview {
  min-width: 0;
  padding: clamp(4rem, 8vw, 8rem) max(var(--ll-space-6), calc((100vw - 86rem) / 2));
}

.ds-hero__copy {
  padding-right: clamp(2rem, 5vw, 6rem);
}

.ds-eyebrow {
  display: flex;
  align-items: center;
  gap: var(--ll-space-2);
  margin: 0 0 var(--ll-space-8);
  color: var(--ll-color-text-muted);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.11em;
}

.ds-eyebrow span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--ll-color-brand);
  border: 1px solid var(--ll-color-brand-ink);
  border-radius: 50%;
}

.ds-hero h1 {
  max-width: 48rem;
  margin: 0;
  color: var(--ll-color-ink);
  font-size: var(--ll-text-xl);
  font-weight: 650;
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.ds-hero h1 em {
  color: var(--ll-color-text-muted);
  font-weight: 450;
}

.ds-hero__description {
  max-width: 37rem;
  margin: var(--ll-space-8) 0 0;
  color: var(--ll-color-text-muted);
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  line-height: 1.6;
}

.ds-hero__preview {
  display: grid;
  place-items: center;
  padding-left: clamp(2rem, 5vw, 6rem);
  background: var(--ll-color-canvas);
  border-left: 1px solid var(--ll-color-divider);
}

.ds-preview-window {
  width: min(100%, 31rem);
  overflow: hidden;
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-lg);
  box-shadow: var(--ll-shadow-raised);
}

.ds-preview-window__topbar {
  display: flex;
  height: 3rem;
  align-items: center;
  gap: 0.375rem;
  padding: 0 var(--ll-space-4);
  background: var(--ll-color-highlight);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-preview-window__topbar > span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--ll-color-border-strong);
  border-radius: 50%;
}

.ds-preview-window__topbar > span:first-child {
  background: var(--ll-color-brand-bright);
}

.ds-preview-window__topbar small {
  margin-left: auto;
  color: var(--ll-color-text-faint);
  font: 500 0.6875rem / 1 var(--ll-font-mono);
}

.ds-preview-window__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ll-space-5);
  padding: clamp(1.5rem, 4vw, 2.5rem);
}

.ds-preview-window__label {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: var(--ll-text-lg);
  font-weight: 650;
}

.ds-preview-window__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ll-space-2);
}

.ds-shell {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  background: var(--ll-color-canvas);
  border-inline: 1px solid var(--ll-color-divider);
}

.ds-shell-frame {
  padding-block: 0;
}

.ds-sidebar {
  position: sticky;
  top: 4.25rem;
  align-self: start;
  height: calc(100vh - 4.25rem);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--ll-space-12) var(--ll-space-6);
  border-right: 1px solid var(--ll-color-border);
  scrollbar-gutter: stable;
}

.ds-sidebar > p {
  margin: 0 0 var(--ll-space-5);
  color: var(--ll-color-text-faint);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ds-sidebar nav {
  display: flex;
  flex-direction: column;
  gap: var(--ll-space-1);
}

.ds-sidebar nav a {
  padding: 0.55rem 0.7rem;
  color: var(--ll-color-text-muted);
  border-radius: var(--ll-radius-sm);
  font-size: 0.8125rem;
  text-decoration: none;
  transition: color var(--ll-duration-normal), background var(--ll-duration-normal);
}

.ds-sidebar nav a:hover,
.ds-sidebar nav a.is-active {
  color: var(--ll-color-ink);
  background: rgba(41, 47, 51, 0.055);
}

.ds-sidebar__note {
  display: flex;
  gap: var(--ll-space-3);
  margin-top: var(--ll-space-16);
  padding-top: var(--ll-space-5);
  border-top: 1px solid var(--ll-color-border);
}

.ds-sidebar__note p {
  margin: 0;
  color: var(--ll-color-text-faint);
  font-size: var(--ll-text-xs);
  line-height: 1.55;
}

.ds-sidebar__note-dot {
  width: 0.45rem;
  height: 0.45rem;
  flex: 0 0 auto;
  margin-top: 0.25rem;
  background: var(--ll-color-brand);
  border-radius: 50%;
}

.ds-content {
  min-width: 0;
  padding: var(--ll-space-16) clamp(1.5rem, 5vw, 5rem) var(--ll-space-20);
}

.ds-section + .ds-section {
  margin-top: var(--ll-space-20);
}

.ds-section__heading {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr);
  gap: var(--ll-space-5);
  margin-bottom: var(--ll-space-12);
}

.ds-index {
  margin: 0.55rem 0 0;
  color: var(--ll-color-text-faint);
  font: 500 var(--ll-text-sm) / 1 var(--ll-font-mono);
}

.ds-section__heading h2 {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 620;
  letter-spacing: -0.045em;
}

.ds-section__heading > div > p {
  max-width: 44rem;
  margin: var(--ll-space-4) 0 0;
  color: var(--ll-color-text-muted);
  line-height: 1.6;
}

.ds-component {
  scroll-margin-top: 6rem;
  min-width: 0;
  overflow: hidden;
  margin-bottom: var(--ll-space-10);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-lg);
}

.ds-palette {
  display: grid;
  gap: var(--ll-space-8);
  padding: var(--ll-space-6);
  background: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-palette__group > p {
  margin: 0 0 var(--ll-space-3);
  color: var(--ll-color-text-muted);
  font: 500 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ds-swatches {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ll-space-2);
}

.ds-swatch {
  display: flex;
  min-height: 7.5rem;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.35rem;
  padding: var(--ll-space-4);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-md);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.ds-swatch span {
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ds-swatch code {
  font-size: 0.6875rem;
  opacity: 0.72;
}

.ds-swatch--metal-950 { color: var(--ll-color-metal-025); background: var(--ll-color-metal-950); }
.ds-swatch--metal-700 { color: var(--ll-color-metal-025); background: var(--ll-color-metal-700); }
.ds-swatch--metal-500 { color: var(--ll-color-metal-950); background: var(--ll-color-metal-500); }
.ds-swatch--metal-400 { color: var(--ll-color-metal-950); background: var(--ll-color-metal-400); }
.ds-swatch--metal-200 { color: var(--ll-color-metal-950); background: var(--ll-color-metal-200); }
.ds-swatch--metal-100 { color: var(--ll-color-metal-950); background: var(--ll-color-metal-100); }
.ds-swatch--metal-050 { color: var(--ll-color-metal-950); background: var(--ll-color-metal-050); }
.ds-swatch--metal-025 { color: var(--ll-color-metal-950); background: var(--ll-color-metal-025); }
.ds-swatch--red-700 { color: #ffffff; background: var(--ll-color-red-700); }
.ds-swatch--red-500 { color: var(--ll-color-metal-950); background: var(--ll-color-red-500); }
.ds-swatch--blue-700 { color: #ffffff; background: var(--ll-color-blue-700); }
.ds-swatch--blue-300 { color: var(--ll-color-metal-950); background: var(--ll-color-blue-300); }

.ds-type-specimens {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ll-space-4);
  padding: var(--ll-space-6);
  background: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-type-specimen {
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-md);
}

.ds-type-specimen__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-2);
  margin-bottom: var(--ll-space-8);
}

.ds-type-specimen__meta span {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ds-type-specimen__meta code {
  color: var(--ll-color-text-muted);
  font-size: 0.6875rem;
}

.ds-type-specimen > p {
  margin: 0;
  color: var(--ll-color-ink);
}

.ds-type-specimen > small {
  display: block;
  margin-top: var(--ll-space-5);
  color: var(--ll-color-text-muted);
  line-height: 1.6;
}

.ds-type-specimen--sans > p {
  font: 620 clamp(2rem, 4vw, 3.5rem) / 0.98 var(--ll-font-display);
  letter-spacing: -0.045em;
}

.ds-type-specimen--mono > p,
.ds-type-specimen--mono > small {
  font-family: var(--ll-font-mono);
}

.ds-type-specimen--mono > p {
  overflow-wrap: anywhere;
  font-size: clamp(1.1rem, 2.4vw, 1.6rem);
  line-height: 1.25;
}

.ds-component__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding: var(--ll-space-6);
  border-bottom: 1px solid var(--ll-color-border);
}

.ds-component__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-3);
}

.ds-component__header h3 {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: 1.25rem;
  font-weight: 650;
  letter-spacing: -0.025em;
}

.ds-component__header code,
.ds-property__label code {
  padding: 0.3rem 0.45rem;
  color: var(--ll-color-text-muted);
  background: var(--ll-color-highlight);
  border-radius: 0.375rem;
  font: 500 0.6875rem / 1 var(--ll-font-mono);
}

.ds-component__header p {
  margin: var(--ll-space-2) 0 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
}

.ds-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ll-color-signal-ink);
  font: 600 0.6875rem / 1 var(--ll-font-mono);
  white-space: nowrap;
}

.ds-status i {
  width: 0.45rem;
  height: 0.45rem;
  background: var(--ll-color-signal);
  border-radius: 50%;
}

.ds-stage {
  min-height: 15rem;
  padding: clamp(2rem, 6vw, 5rem);
  background-color: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-stage--buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--ll-space-3);
}

.ds-properties {
  padding: 0 var(--ll-space-6);
}

.ds-property {
  display: grid;
  grid-template-columns: minmax(9rem, 0.35fr) minmax(0, 1fr);
  gap: var(--ll-space-8);
  padding: var(--ll-space-6) 0;
  border-bottom: 1px solid var(--ll-color-border);
}

.ds-property:last-child {
  border-bottom: 0;
}

.ds-property__label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ll-space-2);
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ds-property__demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ll-space-3);
}

.ds-property__demo--baseline {
  align-items: flex-end;
}

.ds-context {
  display: grid;
  grid-template-columns: minmax(10rem, 0.45fr) minmax(0, 1fr);
  gap: var(--ll-space-8);
  padding: var(--ll-space-8) var(--ll-space-6);
  background: var(--ll-color-canvas);
  border-top: 1px solid var(--ll-color-border);
}

.ds-context__intro > span {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ds-context__intro p {
  margin: var(--ll-space-2) 0 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.55;
}

.ds-pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ll-space-3);
}

.ds-plan-card {
  position: relative;
  display: flex;
  min-height: 15rem;
  flex-direction: column;
  padding: var(--ll-space-5);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-md);
}

.ds-plan-card--featured {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
}

.ds-plan-card__badge {
  position: absolute;
  top: var(--ll-space-4);
  right: var(--ll-space-4);
  padding: 0.3rem 0.5rem;
  color: #ffffff;
  background: var(--ll-color-brand);
  border-radius: var(--ll-radius-pill);
  font: 600 0.625rem / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ds-plan-card__name {
  margin: 0;
  color: var(--ll-color-ink);
  font-weight: 700;
}

.ds-plan-card__description {
  min-height: 2.75rem;
  margin: var(--ll-space-2) 0 var(--ll-space-5);
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  line-height: 1.5;
}

.ds-plan-card__price {
  margin: 0 0 auto;
  color: var(--ll-color-ink);
  font-size: 1.75rem;
  font-weight: 650;
  letter-spacing: -0.04em;
}

.ds-plan-card__price span {
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  font-weight: 500;
}

.ds-plan-card :deep(.ui-button) {
  margin-top: var(--ll-space-6);
}

.ds-stage--command,
.ds-stage--segments {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: var(--ll-space-8);
}

.ds-stage--command > div,
.ds-segment-example {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ll-space-3);
}

.ds-segment-variant {
  min-width: 0;
  overflow: hidden;
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-md);
  box-shadow: 0 0.75rem 2rem rgba(41, 47, 51, 0.06);
}

.ds-segment-variant__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-4);
  padding: var(--ll-space-5) var(--ll-space-5) var(--ll-space-4);
  border-bottom: 1px solid var(--ll-color-border);
}

.ds-segment-variant__header > div {
  display: grid;
  gap: var(--ll-space-2);
}

.ds-segment-variant__header span {
  color: var(--ll-color-text-faint);
  font: 550 0.625rem / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ds-segment-variant__header h4 {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: 1.125rem;
  font-weight: 650;
  letter-spacing: -0.025em;
}

.ds-segment-variant__header code {
  padding: 0.35rem 0.5rem;
  color: var(--ll-color-text-muted);
  background: var(--ll-color-highlight);
  border-radius: 0.375rem;
  font: 500 0.625rem / 1 var(--ll-font-mono);
  white-space: nowrap;
}

.ds-segment-variant__description {
  min-height: 2.75rem;
  margin: 0;
  padding: var(--ll-space-4) var(--ll-space-5) 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  line-height: 1.5;
}

.ds-segment-variant__examples {
  display: grid;
  gap: var(--ll-space-6);
  padding: var(--ll-space-6) var(--ll-space-5);
}

.ds-container-demos {
  display: grid;
  gap: var(--ll-space-5);
  overflow: hidden;
  padding: clamp(2rem, 5vw, 4rem) 0;
  background-color: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-container-demo > div {
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-4);
  padding: var(--ll-space-4) var(--ll-space-5);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-md);
  box-shadow: 0 0.5rem 1.5rem rgba(41, 47, 51, 0.06);
}

.ds-container-demo span {
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ds-container-demo code {
  color: var(--ll-color-text-muted);
  font-size: 0.6875rem;
}

.ds-section-demos {
  display: grid;
  gap: 1px;
  background: var(--ll-color-divider);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-section-demo {
  min-width: 0;
  overflow: hidden;
  background: var(--ll-color-canvas);
}

.ds-section-demo__meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--ll-space-4);
  padding: var(--ll-space-4) var(--ll-space-6);
  background: var(--ll-color-card);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-section-demo__meta span {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-xs);
  font-weight: 650;
}

.ds-section-demo__meta code {
  color: var(--ll-color-text-muted);
  font-size: 0.625rem;
}

.ds-section-demo__sample {
  display: grid;
  min-height: 10rem;
  align-content: center;
  padding: clamp(1.5rem, 4vw, 3rem);
}

.ds-section-demo__sample--stage {
  min-height: 7rem;
}

.ds-section-demo :deep(h4) {
  margin: 0;
  color: var(--ll-color-ink);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 620;
  line-height: 1.05;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.ds-section-demo :deep(p) {
  max-width: 38rem;
  margin: var(--ll-space-3) 0 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.55;
}

.ds-heading-cases {
  display: grid;
  gap: 1px;
  background: var(--ll-color-divider);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-heading-case {
  min-width: 0;
  background: var(--ll-color-card);
}

.ds-heading-case__meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding: var(--ll-space-5) var(--ll-space-6);
  background: var(--ll-color-card);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-heading-case__meta > div {
  display: grid;
  gap: var(--ll-space-2);
}

.ds-heading-case__meta span {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ds-heading-case__meta p {
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  line-height: 1.45;
}

.ds-heading-case__meta code {
  flex: none;
  padding: 0.35rem 0.5rem;
  color: var(--ll-color-text-muted);
  background: var(--ll-color-highlight);
  border-radius: 0.375rem;
  font: 500 0.625rem / 1 var(--ll-font-mono);
  white-space: nowrap;
}

.ds-heading-case__preview {
  min-height: 18rem;
  display: flex;
  align-items: center;
  padding: clamp(2.5rem, 7vw, 6rem);
  background-color: var(--ll-color-canvas);
}

.ds-heading-case__preview--hero {
  min-height: 34rem;
}

.ds-heading-case__preview--statement {
  min-height: 24rem;
}

.ds-heading-case__preview--subsection {
  min-height: 18rem;
}

.ds-heading-case__preview--statement :deep(.ui-heading-block__title h2 > span) {
  color: var(--ll-color-text-muted);
}

.ds-heading-aside {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--ll-space-4);
}

.ds-heading-aside > p {
  max-width: 22rem;
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.45;
  text-align: right;
}

.ds-property__copy {
  max-width: 50rem;
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.6;
}

.ds-property__copy strong {
  color: var(--ll-color-ink);
  font-weight: 650;
}

.ds-collection-example {
  padding: 0;
  background-color: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-collection-section :deep(.ui-section__inner) {
  --ds-stage-shell-padding: 1rem;

  display: grid;
  gap: var(--ll-space-6);
}

.ds-collection-stage :deep(.ui-section-stage__content) {
  display: grid;
  gap: var(--ll-space-6);
}

.ds-grouped-collection {
  display: grid;
  min-width: 0;
  background: var(--ll-color-canvas);
}

.ds-grouped-collection__titles {
  padding-inline: calc(2 * var(--ds-stage-shell-padding));
}

.ds-collection-example__heading--outside,
.ds-collection-heading-outside {
  padding-inline: calc(2 * var(--ds-stage-shell-padding));
}

.ds-collection-example__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-3);
}

.ds-collection-example__heading span {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ds-collection-example__heading code {
  padding: 0.35rem 0.5rem;
  color: var(--ll-color-text-muted);
  background: var(--ll-color-highlight);
  border-radius: 0.375rem;
  font-size: 0.625rem;
}

.ds-resource-group {
  display: grid;
  min-width: 0;
  align-content: stretch;
  gap: var(--ll-space-3);
}

.ds-resource-group--releases {
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.ds-resource-group :deep(.ui-card--row) {
  min-height: 0;
}

.ds-resource-group :deep(.ui-card--row .ui-card__content) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-content: center;
  gap: var(--ll-space-2) var(--ll-space-5);
}

.ds-resource-group :deep(.ui-card--row .ui-card__title) {
  grid-column: 1;
  grid-row: 1;
}

.ds-resource-group :deep(.ui-card--row .ui-card__description) {
  grid-column: 1;
  grid-row: 2;
  margin-top: 0;
}

.ds-resource-group :deep(.ui-card--row .ui-card__footer) {
  grid-column: 2;
  grid-row: 1 / span 2;
}

.ds-media-visual {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: #e7edf1;
}

.ds-media-visual::before,
.ds-media-visual::after {
  position: absolute;
  content: '';
}

.ds-media-visual--messages {
  background-image:
    linear-gradient(135deg, rgba(34, 102, 153, 0.2), transparent 58%),
    linear-gradient(#eef3f6, #dce5ea);
}

.ds-media-visual--messages::before {
  width: 68%;
  height: 34%;
  top: 18%;
  left: 12%;
  background:
    linear-gradient(var(--ll-color-metal-500) 0 0) 1rem 1rem / 58% 0.35rem no-repeat,
    linear-gradient(var(--ll-color-metal-400) 0 0) 1rem 1.75rem / 78% 0.35rem no-repeat,
    #ffffff;
  border: 1px solid var(--ll-color-border);
  border-radius: var(--ll-radius-md);
  box-shadow: var(--ll-shadow-raised);
}

.ds-media-visual--messages::after {
  width: 54%;
  height: 26%;
  right: 10%;
  bottom: 12%;
  background: var(--ll-color-metal-950);
  border-radius: var(--ll-radius-md);
  box-shadow: var(--ll-shadow-raised);
}

.ds-media-visual--signal {
  background:
    linear-gradient(180deg, transparent 10%, rgba(255, 255, 255, 0.6)),
    repeating-linear-gradient(90deg, var(--ll-color-blue-300) 0 0.55rem, transparent 0.55rem 1.1rem),
    var(--ll-color-blue-100);
  background-size: 100% 100%, 200% 70%, 100% 100%;
  background-position: center, left bottom, center;
  background-repeat: no-repeat;
}

.ds-media-visual--signal::after {
  width: 2.75rem;
  height: 2.75rem;
  inset: 0;
  margin: auto;
  background: url('/brand/twemoji-small-airplane.svg') center / contain no-repeat;
  filter: drop-shadow(0 0.5rem 0.8rem rgba(41, 47, 51, 0.2));
}

.ds-media-visual--console {
  background:
    linear-gradient(90deg, transparent 30%, rgba(255, 255, 255, 0.06) 30%),
    var(--ll-color-metal-950);
}

.ds-media-visual--console::before {
  inset: 16% 10%;
  background:
    linear-gradient(var(--ll-color-red-500) 0 0) 10% 12% / 45% 0.35rem no-repeat,
    linear-gradient(var(--ll-color-blue-300) 0 0) 10% 32% / 72% 0.35rem no-repeat,
    linear-gradient(var(--ll-color-metal-700) 0 0) 10% 52% / 58% 0.35rem no-repeat,
    linear-gradient(var(--ll-color-blue-300) 0 0) 10% 72% / 80% 0.35rem no-repeat;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--ll-radius-sm);
}

.ds-media-visual.is-animated::before {
  animation: ds-media-float 1.2s ease-in-out infinite alternate;
}

.ds-media-visual--signal.is-animated {
  animation: ds-media-signal 1.8s linear infinite;
}

.ds-media-visual--signal.is-animated::after {
  animation: ds-media-plane 1.1s ease-in-out infinite alternate;
}

.ds-grid-list-link {
  color: var(--ll-color-text-muted);
  text-decoration: none;
}

.ds-grid-list-link:hover {
  color: var(--ll-color-primary);
}

.ds-collection-example :deep(.ui-grid-list__leading strong) {
  color: var(--ll-color-ink);
  font-weight: 650;
}

.ds-team-grid {
  margin-top: 0;
}

.ds-team-member {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--ll-space-3);
  padding: var(--ll-space-3);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--ll-radius-structural);
  transition:
    border-color var(--ll-duration-normal) var(--ll-ease-out),
    background var(--ll-duration-normal) var(--ll-ease-out),
    box-shadow var(--ll-duration-normal) var(--ll-ease-out);
}

.ds-team-member:hover {
  background: var(--ll-color-card);
  border-color: var(--ll-color-divider);
  box-shadow: var(--ll-shadow-raised);
}

.ds-team-member__avatar {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(145deg, var(--ll-color-blue-600), var(--ll-color-metal-950));
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--ll-color-border);
  font: 600 0.6875rem / 1 var(--ll-font-mono);
}

.ds-team-member > div {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.ds-team-member strong {
  overflow: hidden;
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds-team-member div > span {
  overflow: hidden;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds-collection-example--accordion :deep(.ui-accordion) {
  width: min(100%, 58rem);
  margin-inline: auto;
}

.ds-component--navigation {
  overflow: hidden;
}

.ds-site-navigation-demo {
  position: relative;
  min-height: 38rem;
  overflow: hidden;
  background: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-site-navigation-demo > :deep(.ui-main-navigation) {
  position: absolute;
  inset: 0 0 auto;
}

.ds-site-brand,
.ds-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-3);
  color: var(--ll-color-ink);
  text-decoration: none;
}

.ds-site-brand img,
.ds-footer-brand img {
  object-fit: contain;
}

.ds-site-brand strong,
.ds-footer-brand strong {
  font-weight: 680;
  letter-spacing: -0.025em;
}

.ds-site-navigation-demo__body {
  position: absolute;
  top: 50%;
  left: clamp(2rem, 7vw, 6rem);
  width: min(30rem, calc(100% - 4rem));
  transform: translateY(-35%);
}

.ds-site-navigation-demo__body > span {
  color: var(--ll-color-primary);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ds-site-navigation-demo__body h4 {
  max-width: 28rem;
  margin: var(--ll-space-4) 0;
  color: var(--ll-color-ink);
  font-size: clamp(2.25rem, 5vw, 4rem);
  font-weight: 630;
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.ds-site-navigation-demo__body p {
  max-width: 25rem;
  margin: 0;
  color: var(--ll-color-text-muted);
  line-height: 1.6;
}

.ds-showcase-example {
  padding: clamp(1rem, 3vw, 2rem);
  background: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-interface-screen {
  --ds-interface-accent: var(--ll-color-primary);
  --ds-interface-accent-soft: var(--ll-color-blue-100);

  position: absolute;
  inset: 0;
  overflow: hidden;
}

.ds-interface-screen--workflows {
  --ds-interface-accent: var(--ll-color-red-700);
  --ds-interface-accent-soft: var(--ll-color-red-100);
}

.ds-interface-screen--harness {
  --ds-interface-accent: var(--ll-color-metal-950);
  --ds-interface-accent-soft: var(--ll-color-metal-200);
}

.ds-interface-screen--memory {
  --ds-interface-accent: #6f63a8;
  --ds-interface-accent-soft: #efedf8;
}

.ds-interface-screen--server {
  --ds-interface-accent: #3d8b5c;
  --ds-interface-accent-soft: #e5f4ea;
}

.ds-interface-screen__code,
.ds-interface-screen__app {
  position: absolute;
  overflow: hidden;
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-lg);
  box-shadow: 0 2rem 4rem rgba(41, 47, 51, 0.14);
}

.ds-interface-screen__code {
  bottom: 7%;
  left: 5%;
  width: 48%;
  height: 56%;
}

.ds-interface-screen__app {
  top: 14%;
  right: -3%;
  width: 64%;
  height: 70%;
}

.ds-interface-screen__code > header,
.ds-interface-screen__app > header {
  display: flex;
  min-height: 3rem;
  align-items: center;
  gap: var(--ll-space-2);
  padding: 0 var(--ll-space-5);
  background: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-interface-screen__code > header {
  justify-content: space-between;
}

.ds-interface-screen__code > header span {
  color: var(--ll-color-text-muted);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
}

.ds-interface-screen__code > header i {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--ds-interface-accent);
  border-radius: 50%;
  box-shadow: 0 0 0 0.25rem var(--ds-interface-accent-soft);
}

.ds-interface-screen__code pre {
  height: calc(100% - 3rem);
  padding: clamp(1.25rem, 4vw, 3rem);
  margin: 0;
  color: var(--ll-color-metal-700);
  background: linear-gradient(145deg, #ffffff, var(--ds-interface-accent-soft));
  font-size: clamp(0.7rem, 1.5vw, 0.95rem);
  line-height: 1.9;
}

.ds-interface-screen__code code,
.ds-interface-screen__code code span {
  display: block;
}

.ds-interface-screen__code code span:first-child,
.ds-interface-screen__code code span:last-child {
  color: var(--ds-interface-accent);
  font-weight: 600;
}

.ds-interface-screen__app > header > span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--ll-color-metal-500);
  border-radius: 50%;
}

.ds-interface-screen__app > header > span:first-child {
  background: var(--ll-color-red-500);
}

.ds-interface-screen__app > header strong {
  margin-left: auto;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  font-weight: 600;
}

.ds-interface-screen__app-body {
  display: grid;
  height: calc(100% - 3rem);
  grid-template-columns: minmax(8rem, 0.3fr) minmax(0, 1fr);
}

.ds-interface-screen__app-body nav {
  display: grid;
  align-content: start;
  gap: var(--ll-space-2);
  padding: var(--ll-space-5);
  background: var(--ll-color-canvas);
  border-right: 1px solid var(--ll-color-divider);
}

.ds-interface-screen__app-body nav span {
  padding: var(--ll-space-3);
  color: var(--ll-color-text-muted);
  border-radius: var(--ll-radius-sm);
  font-size: var(--ll-text-xs);
}

.ds-interface-screen__app-body nav span.is-active {
  color: var(--ds-interface-accent);
  background: var(--ds-interface-accent-soft);
  font-weight: 650;
}

.ds-interface-screen__canvas {
  display: grid;
  align-content: center;
  gap: var(--ll-space-5);
  padding: clamp(1.25rem, 4vw, 3rem);
  background: var(--ll-color-canvas);
}

.ds-interface-screen__canvas > p {
  width: fit-content;
  margin: 0;
  padding: var(--ll-space-2) var(--ll-space-3);
  color: var(--ds-interface-accent);
  background: var(--ds-interface-accent-soft);
  border-radius: var(--ll-radius-pill);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
}

.ds-interface-screen__canvas > div {
  display: flex;
  min-height: 5rem;
  align-items: end;
  gap: var(--ll-space-3);
  padding: var(--ll-space-4);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-md);
}

.ds-interface-screen__canvas > div span {
  width: 22%;
  height: 65%;
  background: var(--ds-interface-accent-soft);
  border-radius: var(--ll-radius-sm);
}

.ds-interface-screen__canvas > div span:nth-child(2) {
  height: 100%;
  background: var(--ds-interface-accent);
}

.ds-interface-screen__canvas > div span:nth-child(3) {
  height: 45%;
}

.ds-site-footer-demo {
  overflow: hidden;
  background: var(--ll-color-canvas);
  border-bottom: 1px solid var(--ll-color-divider);
}

.ds-site-footer-demo :deep(.ui-site-footer) {
  padding-top: var(--ll-space-10);
}

.ds-footer-newsletter {
  display: grid;
  gap: var(--ll-space-3);
}

.ds-footer-newsletter label {
  color: var(--ll-color-brand);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ds-footer-newsletter > div {
  display: flex;
  gap: var(--ll-space-2);
}

.ds-footer-newsletter input {
  width: 100%;
  min-width: 0;
  height: 2.125rem;
  padding: 0 var(--ll-space-4);
  color: var(--ll-color-ink);
  background: var(--ll-color-card);
  border: 1px solid var(--ll-color-divider);
  border-radius: var(--ll-radius-pill);
  outline: 0;
}

.ds-footer-newsletter input:focus {
  border-color: var(--ll-color-primary);
  box-shadow: var(--ll-shadow-focus);
}

@keyframes ds-media-float {
  to { transform: translateY(-0.5rem); }
}

@keyframes ds-media-signal {
  to { background-position: center, 2.2rem bottom, center; }
}

@keyframes ds-media-plane {
  to { transform: translate(0.75rem, -0.5rem) rotate(4deg); }
}

:deep(.ds-command-button) {
  width: fit-content;
  min-width: 15.375rem;
  max-width: 100%;
  justify-content: space-between;
  gap: 0.6875rem;
}

.ds-command-button code {
  overflow: hidden;
  padding: 0;
  border: 0;
  color: currentColor;
  background: transparent;
  font: 400 0.90625rem / 1.125rem var(--ll-font-mono);
  letter-spacing: 0.055em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds-sr-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.ds-stage__caption {
  color: var(--ll-color-text-muted);
  font: 600 var(--ll-text-xs) / 1 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.ds-segment-example small {
  color: var(--ll-color-text-faint);
  font: 500 0.6875rem / 1 var(--ll-font-mono);
}

.ds-component__footnote {
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: var(--ll-space-6);
  padding: var(--ll-space-5) var(--ll-space-6);
}

.ds-component__footnote span {
  color: var(--ll-color-ink);
  font-size: var(--ll-text-xs);
  font-weight: 650;
}

.ds-component__footnote p {
  margin: 0;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-xs);
  line-height: 1.55;
}

.ds-footer {
  color: var(--ll-color-text-muted);
  background: var(--ll-color-canvas);
  border-top: 1px solid var(--ll-color-divider);
  font-size: var(--ll-text-xs);
}

.ds-footer__container {
  display: flex;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding-block: var(--ll-space-8);
}

.ds-footer p {
  margin: 0;
  color: var(--ll-color-ink);
  font-weight: 650;
}

@media (min-width: 40rem) {
  .ds-collection-section :deep(.ui-section__inner) {
    --ds-stage-shell-padding: 1.6875rem;
  }
}

@media (max-width: 64rem) {
  .ds-version,
  .ds-header__link {
    display: none;
  }

  .ds-hero {
    grid-template-columns: 1fr;
  }

  .ds-hero__copy,
  .ds-hero__preview {
    padding: var(--ll-space-16) var(--ll-space-6);
  }

  .ds-hero__preview {
    border-top: 1px solid var(--ll-color-border);
    border-left: 0;
  }

  .ds-shell {
    grid-template-columns: 1fr;
    border-inline: 0;
  }

  .ds-sidebar {
    display: none;
  }
}

@media (max-width: 44rem) {
  .ds-header__meta :deep(.ui-button) {
    display: none;
  }

  .ds-content {
    padding: var(--ll-space-12) var(--ll-space-4) var(--ll-space-16);
  }

  .ds-section__heading {
    grid-template-columns: 1fr;
  }

  .ds-index {
    margin: 0;
  }

  .ds-component__header,
  .ds-property,
  .ds-context,
  .ds-stage--command,
  .ds-stage--segments,
  .ds-component__footnote {
    grid-template-columns: 1fr;
  }

  .ds-property,
  .ds-context {
    gap: var(--ll-space-5);
  }

  .ds-pricing-grid {
    grid-template-columns: 1fr;
  }

  .ds-swatches,
  .ds-type-specimens {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ds-component__header {
    flex-direction: column;
  }

  .ds-heading-case__meta {
    flex-direction: column;
    gap: var(--ll-space-3);
  }

  .ds-heading-case__preview {
    min-height: 0;
    padding: var(--ll-space-12) var(--ll-space-5);
  }

  .ds-collection-example {
    padding: var(--ll-space-6) var(--ll-space-4);
  }

  .ds-collection-example__heading {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--ll-space-2);
  }

  .ds-heading-aside {
    align-items: flex-start;
  }

  .ds-heading-aside > p {
    text-align: left;
  }

  .ds-stage {
    padding: var(--ll-space-10) var(--ll-space-5);
  }

  .ds-stage--buttons {
    justify-content: flex-start;
  }

  :deep(.ds-command-button) {
    width: 100%;
    min-width: 0;
  }

  .ds-footer__container {
    flex-direction: column;
  }
}

@media (max-width: 30rem) {
  .ds-swatches,
  .ds-type-specimens {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  :global(html) {
    scroll-behavior: auto;
  }

  .ds-media-visual.is-animated,
  .ds-media-visual.is-animated::before,
  .ds-media-visual.is-animated::after {
    animation: none;
  }

  .ds-team-member {
    transition: none;
  }
}
</style>
