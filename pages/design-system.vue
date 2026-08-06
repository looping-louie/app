<script setup lang="ts">
import UiButton from '~/components/ui/Button.vue'
import UiSegmentedControl from '~/components/ui/SegmentedControl.vue'

definePageMeta({
  layout: false,
})

useHead({
  title: 'Design system · Looping Louie',
  meta: [
    {
      name: 'description',
      content: 'Componentes, fundamentos y patrones visuales de Looping Louie.',
    },
    { name: 'theme-color', content: '#f5f7f8' },
  ],
})

const deployment = ref('cloud')
const environment = ref('production')
const copiedCommand = ref<string | null>(null)
const copyError = ref<string | null>(null)
let copyResetTimer: ReturnType<typeof setTimeout> | undefined

const deploymentOptions = [
  { value: 'cloud', label: 'Louie Cloud' },
  { value: 'self-hosted', label: 'Self-hosted' },
]

const environmentOptions = [
  { value: 'preview', label: 'Preview' },
  { value: 'production', label: 'Producción' },
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
  if (copiedCommand.value === command) return `Copiado: ${command}`
  if (copyError.value === command) return `No se pudo copiar: ${command}`
  return `Copiar comando: ${command}`
}

onBeforeUnmount(() => {
  if (copyResetTimer) clearTimeout(copyResetTimer)
})
</script>

<template>
  <div class="design-system-page">
    <header class="ds-header">
      <NuxtLink to="/" class="ds-brand" aria-label="Volver a Looping Louie">
        <span class="ds-brand__mark" aria-hidden="true">
          <span class="ds-brand__orbit" />
          <span class="ds-brand__dot" />
        </span>
        <span>Looping Louie</span>
      </NuxtLink>

      <div class="ds-header__meta">
        <span class="ds-version">Design system · 0.1</span>
        <NuxtLink to="/" class="ds-header__link">Volver a la web</NuxtLink>
        <UiButton to="/app" variant="stroke" size="sm">Abrir aplicación</UiButton>
      </div>
    </header>

    <main>
      <section class="ds-hero">
        <div class="ds-hero__copy">
          <p class="ds-eyebrow"><span /> Fundamentos</p>
          <h1>Profesional.<br><em>Con una hélice suelta.</em></h1>
          <p class="ds-hero__description">
            La primera versión del lenguaje visual de Looping Louie. Clara, técnica y sobria;
            con el espacio justo para que Louie sobrevuele la interfaz sin pilotarla.
          </p>
        </div>

        <div class="ds-hero__preview" aria-label="Vista previa de acciones">
          <div class="ds-preview-window">
            <div class="ds-preview-window__topbar">
              <span />
              <span />
              <span />
              <small>quickstart.ll</small>
            </div>
            <div class="ds-preview-window__body">
              <p class="ds-preview-window__label">Tu primer loop despega aquí</p>
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
                <UiButton size="sm">Crear proyecto</UiButton>
                <UiButton variant="stroke" size="sm">Documentación</UiButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="ds-shell">
        <aside class="ds-sidebar" aria-label="Índice del sistema de diseño">
          <p>Contenido</p>
          <nav>
            <a href="#foundations" class="is-active">01 · Fundamentos</a>
            <a href="#colors">Color</a>
            <a href="#typography">Tipografía</a>
            <a href="#actions">02 · Acciones</a>
            <a href="#buttons">Botones</a>
            <a href="#copy-command">Comando copiable</a>
            <a href="#segmented-control">Selector segmentado</a>
          </nav>
          <div class="ds-sidebar__note">
            <span class="ds-sidebar__note-dot" />
            <p>Componentes listos para adoptar progresivamente en la aplicación.</p>
          </div>
        </aside>

        <div class="ds-content">
          <section id="foundations" class="ds-section ds-section--foundations">
            <div class="ds-section__heading">
              <p class="ds-index">01</p>
              <div>
                <h2>Fundamentos</h2>
                <p>
                  El fuselaje de Louie convertido en sistema: grises metálicos, rojo de marca,
                  azul de acción y una tipografía técnica que no necesita ponerse casco.
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
                  <p>Colores originales del Small Airplane y tonos derivados para interfaz.</p>
                </div>
                <span class="ds-status"><i /> Defined</span>
              </header>

              <div class="ds-palette">
                <div class="ds-palette__group">
                  <p>Metal</p>
                  <div class="ds-swatches">
                    <div class="ds-swatch ds-swatch--gray-950"><span>Gray 950</span><code>#292F33</code></div>
                    <div class="ds-swatch ds-swatch--gray-600"><span>Gray 600</span><code>#66757F</code></div>
                    <div class="ds-swatch ds-swatch--gray-300"><span>Gray 300</span><code>#CCD6DD</code></div>
                    <div class="ds-swatch ds-swatch--gray-050"><span>Gray 050</span><code>#F5F7F8</code></div>
                  </div>
                </div>

                <div class="ds-palette__group">
                  <p>Identidad y acción</p>
                  <div class="ds-swatches ds-swatches--brand">
                    <div class="ds-swatch ds-swatch--red-700"><span>Louie Red</span><code>#BE1931</code></div>
                    <div class="ds-swatch ds-swatch--red-500"><span>Louie Coral</span><code>#EA596E</code></div>
                    <div class="ds-swatch ds-swatch--blue-700"><span>Cockpit Blue</span><code>#226699</code></div>
                    <div class="ds-swatch ds-swatch--blue-300"><span>Sky Highlight</span><code>#9BC7E3</code></div>
                  </div>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>Regla</span>
                <p>Azul para acciones principales, rojo para identidad y énfasis; los grises construyen toda la interfaz.</p>
              </footer>
            </article>

            <article id="typography" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Tipografía</h3>
                    <code>Instrument Sans + Commit Mono</code>
                  </div>
                  <p>Una pareja libre inspirada en la combinación editorial y técnica de Mastra.</p>
                </div>
                <span class="ds-status"><i /> Self-hosted</span>
              </header>

              <div class="ds-type-specimens">
                <div class="ds-type-specimen ds-type-specimen--sans">
                  <div class="ds-type-specimen__meta">
                    <span>Instrument Sans</span>
                    <code>Display · Body · UI</code>
                  </div>
                  <p>Agentes que mantienen el rumbo.</p>
                  <small>Precisa y compacta, con el punto justo de personalidad para que la interfaz no parezca una declaración de Hacienda.</small>
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
                <span>Licencia</span>
                <p>Ambas familias usan SIL Open Font License 1.1 y se sirven desde el propio proyecto.</p>
              </footer>
            </article>
          </section>

          <section id="actions" class="ds-section">
            <div class="ds-section__heading">
              <p class="ds-index">02</p>
              <div>
                <h2>Acciones</h2>
                <p>
                  Controles para iniciar, elegir o copiar. Comparten geometría y movimiento,
                  pero cada uno conserva una responsabilidad clara.
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
                  <p>Acciones y enlaces con tres niveles de jerarquía.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-stage ds-stage--buttons">
                <UiButton variant="primary" size="md">Crear loop</UiButton>
                <UiButton variant="secondary">Ver documentación</UiButton>
                <UiButton variant="stroke">Cancelar</UiButton>
              </div>

              <div class="ds-properties">
                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Variantes</span>
                    <code>variant</code>
                  </div>
                  <div class="ds-property__demo">
                    <UiButton variant="primary" size="sm">Primary</UiButton>
                    <UiButton variant="secondary" size="sm">Secondary</UiButton>
                    <UiButton variant="stroke" size="sm">Stroke</UiButton>
                    <UiButton variant="gray" size="sm">Gray 950</UiButton>
                  </div>
                </div>

                <div class="ds-property">
                  <div class="ds-property__label">
                    <span>Tamaños</span>
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
                    <span>Estados</span>
                    <code>loading · disabled</code>
                  </div>
                  <div class="ds-property__demo">
                    <UiButton loading>Guardando</UiButton>
                    <UiButton variant="secondary" disabled>No disponible</UiButton>
                    <UiButton variant="secondary">
                      Continuar
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
                  <span>En contexto</span>
                  <p>La jerarquía debe seguir funcionando dentro de una composición real.</p>
                </div>
                <div class="ds-pricing-grid">
                  <div class="ds-plan-card">
                    <p class="ds-plan-card__name">Starter</p>
                    <p class="ds-plan-card__description">Para loops que todavía llevan ruedines.</p>
                    <p class="ds-plan-card__price">0 € <span>/ mes</span></p>
                    <UiButton variant="secondary" block>Empezar gratis</UiButton>
                  </div>
                  <div class="ds-plan-card ds-plan-card--featured">
                    <span class="ds-plan-card__badge">Recomendado</span>
                    <p class="ds-plan-card__name">Flight crew</p>
                    <p class="ds-plan-card__description">Para equipos con Louie en producción.</p>
                    <p class="ds-plan-card__price">49 € <span>/ mes</span></p>
                    <UiButton block>Elegir Flight crew</UiButton>
                  </div>
                </div>
              </div>
            </article>

            <article id="copy-command" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Botón con icono</h3>
                    <code>UiButton</code>
                  </div>
                  <p>El botón presenta la acción; la página decide qué ocurre al pulsarlo.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-stage ds-stage--command">
                <div>
                  <span class="ds-stage__caption">Instalación rápida</span>
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
                  <span class="ds-stage__caption">Inicializar un proyecto</span>
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
                <span>Responsabilidad</span>
                <p>La página controla el portapapeles y pasa al botón su etiqueta, contenido, icono y estado visual.</p>
              </footer>
              <p class="ds-sr-status" aria-live="polite">
                {{ copiedCommand ? `Comando copiado: ${copiedCommand}` : copyError ? `No se pudo copiar: ${copyError}` : '' }}
              </p>
            </article>

            <article id="segmented-control" class="ds-component">
              <header class="ds-component__header">
                <div>
                  <div class="ds-component__title-row">
                    <h3>Segmented control</h3>
                    <code>UiSegmentedControl</code>
                  </div>
                  <p>Una elección única entre opciones relacionadas, no dos botones compitiendo.</p>
                </div>
                <span class="ds-status"><i /> Stable</span>
              </header>

              <div class="ds-stage ds-stage--segments">
                <div class="ds-segment-example">
                  <span class="ds-stage__caption">Despliegue</span>
                  <UiSegmentedControl
                    v-model="deployment"
                    :options="deploymentOptions"
                    accent="gray"
                    aria-label="Tipo de despliegue"
                  />
                  <small>Seleccionado: {{ deployment }}</small>
                </div>
                <div class="ds-segment-example">
                  <span class="ds-stage__caption">Entorno</span>
                  <UiSegmentedControl
                    v-model="environment"
                    :options="environmentOptions"
                    accent="primary"
                    aria-label="Entorno de ejecución"
                  />
                  <small>Seleccionado: {{ environment }}</small>
                </div>
              </div>

              <footer class="ds-component__footnote">
                <span>Teclado</span>
                <p>Admite flechas, inicio y fin siguiendo el patrón accesible de un grupo de opciones.</p>
              </footer>
            </article>
          </section>
        </div>
      </div>
    </main>

    <footer class="ds-footer">
      <p>Looping Louie Design System</p>
      <span>Construido para dar vueltas sin marear al usuario.</span>
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
  min-height: 100vh;
  overflow-x: clip;
  color: var(--ll-color-text);
  background-color: var(--ll-color-canvas);
  background-image:
    linear-gradient(rgba(41, 47, 51, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(41, 47, 51, 0.035) 1px, transparent 1px);
  background-size: 4rem 4rem;
  font-family: var(--ll-font-sans);
  -webkit-font-smoothing: antialiased;
}

.ds-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  min-height: 4.25rem;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding: var(--ll-space-3) max(var(--ll-space-6), calc((100vw - 86rem) / 2));
  background: rgba(245, 247, 248, 0.88);
  border-bottom: 1px solid var(--ll-color-border);
  backdrop-filter: blur(16px);
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
  position: relative;
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
}

.ds-brand__orbit {
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid var(--ll-color-ink);
  border-right-color: transparent;
  border-radius: 50%;
  transform: rotate(-30deg);
}

.ds-brand__dot {
  position: absolute;
  top: 0.1rem;
  right: 0;
  width: 0.5rem;
  height: 0.5rem;
  background: var(--ll-color-brand);
  border: 1.5px solid var(--ll-color-ink);
  border-radius: 50%;
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
  background: rgba(255, 255, 255, 0.28);
  border-left: 1px solid var(--ll-color-border);
}

.ds-preview-window {
  width: min(100%, 31rem);
  overflow: hidden;
  background: var(--ll-color-surface-raised);
  border: 1px solid var(--ll-color-border-strong);
  border-radius: var(--ll-radius-lg);
  box-shadow: var(--ll-shadow-raised);
}

.ds-preview-window__topbar {
  display: flex;
  height: 3rem;
  align-items: center;
  gap: 0.375rem;
  padding: 0 var(--ll-space-4);
  background: var(--ll-color-surface-muted);
  border-bottom: 1px solid var(--ll-color-border);
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
  max-width: 86rem;
  margin: 0 auto;
  background: rgba(245, 247, 248, 0.92);
  border-inline: 1px solid var(--ll-color-border);
}

.ds-sidebar {
  position: sticky;
  top: 4.25rem;
  align-self: start;
  min-height: calc(100vh - 4.25rem);
  padding: var(--ll-space-12) var(--ll-space-6);
  border-right: 1px solid var(--ll-color-border);
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
  background: var(--ll-color-surface);
  border: 1px solid var(--ll-color-border);
  border-radius: var(--ll-radius-lg);
}

.ds-palette {
  display: grid;
  gap: var(--ll-space-8);
  padding: var(--ll-space-6);
  background: var(--ll-color-surface-raised);
  border-bottom: 1px solid var(--ll-color-border);
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
  border: 1px solid rgba(41, 47, 51, 0.08);
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

.ds-swatch--gray-950 { color: #ffffff; background: var(--ll-color-gray-950); }
.ds-swatch--gray-600 { color: #ffffff; background: var(--ll-color-gray-600); }
.ds-swatch--gray-300 { color: var(--ll-color-gray-950); background: var(--ll-color-gray-300); }
.ds-swatch--gray-050 { color: var(--ll-color-gray-950); background: var(--ll-color-gray-050); }
.ds-swatch--red-700 { color: #ffffff; background: var(--ll-color-red-700); }
.ds-swatch--red-500 { color: var(--ll-color-gray-950); background: var(--ll-color-red-500); }
.ds-swatch--blue-700 { color: #ffffff; background: var(--ll-color-blue-700); }
.ds-swatch--blue-300 { color: var(--ll-color-gray-950); background: var(--ll-color-blue-300); }

.ds-type-specimens {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ll-space-4);
  padding: var(--ll-space-6);
  background: var(--ll-color-surface-raised);
  border-bottom: 1px solid var(--ll-color-border);
}

.ds-type-specimen {
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  background: var(--ll-color-gray-050);
  border: 1px solid var(--ll-color-border);
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
  background: var(--ll-color-surface-muted);
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
  background-color: var(--ll-color-surface-raised);
  background-image:
    linear-gradient(rgba(41, 47, 51, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(41, 47, 51, 0.045) 1px, transparent 1px);
  background-size: 2rem 2rem;
  border-bottom: 1px solid var(--ll-color-border);
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
  background: var(--ll-color-surface-raised);
  border: 1px solid var(--ll-color-border);
  border-radius: var(--ll-radius-md);
}

.ds-plan-card--featured {
  background: linear-gradient(180deg, var(--ll-color-surface-raised), var(--ll-color-brand-soft));
  border-color: var(--ll-color-brand-bright);
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
  align-items: center;
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
  display: flex;
  justify-content: space-between;
  gap: var(--ll-space-6);
  padding: var(--ll-space-8) max(var(--ll-space-6), calc((100vw - 86rem) / 2));
  color: var(--ll-color-text-muted);
  background: var(--ll-color-ink);
  font-size: var(--ll-text-xs);
}

.ds-footer p {
  margin: 0;
  color: var(--ll-color-surface-raised);
  font-weight: 650;
}

@media (max-width: 64rem) {
  .ds-header {
    padding-inline: var(--ll-space-5);
  }

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

  .ds-footer {
    flex-direction: column;
    padding: var(--ll-space-8) var(--ll-space-6);
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
}
</style>
