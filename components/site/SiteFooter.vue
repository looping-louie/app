<script setup lang="ts">
import UiContainer from '~/components/ui/Container.vue'
import UiSection from '~/components/ui/Section.vue'

interface FooterLink {
  label: string
  to?: string
  href?: string
}

interface FooterColumn {
  label: string
  links: FooterLink[]
}

withDefaults(defineProps<{
  columns: FooterColumn[]
  legalLinks?: FooterLink[]
  status?: string
}>(), {
  legalLinks: () => [],
  status: 'All systems operational',
})

function linkComponent(link: FooterLink) {
  return link.to ? resolveComponent('NuxtLink') : 'a'
}

function linkBindings(link: FooterLink) {
  return link.to ? { to: link.to } : { href: link.href || '#' }
}
</script>

<template>
  <footer class="ui-site-footer">
    <UiContainer size="wide">
      <UiSection
        as="div"
        surface="raised"
        space="none"
        rounded
        backdrop="bottom"
        class="ui-site-footer__island"
      >
        <div class="ui-site-footer__content">
          <div class="ui-site-footer__top">
            <div class="ui-site-footer__brand"><slot name="brand" /></div>
            <div v-if="$slots.newsletter" class="ui-site-footer__newsletter">
              <slot name="newsletter" />
            </div>
          </div>

          <nav class="ui-site-footer__columns" aria-label="Footer navigation">
            <section v-for="column in columns" :key="column.label">
              <h2>{{ column.label }}</h2>
              <component
                :is="linkComponent(link)"
                v-for="link in column.links"
                :key="link.label"
                v-bind="linkBindings(link)"
              >{{ link.label }}</component>
            </section>
          </nav>

          <div class="ui-site-footer__bottom">
            <p class="ui-site-footer__status"><span aria-hidden="true" />{{ status }}</p>
            <nav class="ui-site-footer__legal" aria-label="Legal">
              <component
                :is="linkComponent(link)"
                v-for="link in legalLinks"
                :key="link.label"
                v-bind="linkBindings(link)"
              >{{ link.label }}</component>
            </nav>
          </div>
        </div>
      </UiSection>
    </UiContainer>
  </footer>
</template>

<style scoped>
.ui-site-footer {
  position: relative;
  overflow: hidden;
  padding: clamp(5rem, 10vw, 9rem) 0 0;
  background: var(--ll-color-canvas);
}

.ui-site-footer__content {
  display: grid;
  gap: clamp(3rem, 7vw, 6rem);
  padding: clamp(2rem, 5vw, 4.5rem);
}

.ui-site-footer__top {
  display: grid;
  grid-template-columns: minmax(12rem, 1fr) minmax(20rem, 1fr);
  align-items: start;
  gap: var(--ll-space-8);
}

.ui-site-footer__brand {
  display: flex;
  align-items: center;
}

.ui-site-footer__newsletter {
  min-width: 0;
}

.ui-site-footer__columns {
  display: grid;
  grid-template-columns: repeat(6, minmax(7rem, 1fr));
  gap: var(--ll-space-8) var(--ll-space-6);
}

.ui-site-footer__columns section {
  display: grid;
  align-content: start;
  gap: var(--ll-space-3);
}

.ui-site-footer__columns h2 {
  margin: 0 0 var(--ll-space-2);
  color: var(--ll-color-ink);
  font-size: var(--ll-text-sm);
  font-weight: 650;
}

.ui-site-footer__columns a,
.ui-site-footer__legal a {
  width: fit-content;
  color: var(--ll-color-text-muted);
  font-size: var(--ll-text-sm);
  line-height: 1.35;
  text-decoration: none;
  transition: color var(--ll-duration-normal) var(--ll-ease-out);
}

.ui-site-footer__columns a:hover,
.ui-site-footer__legal a:hover {
  color: var(--ll-color-primary);
}

.ui-site-footer__columns a:focus-visible,
.ui-site-footer__legal a:focus-visible {
  outline: 2px solid var(--ll-color-primary);
  outline-offset: 2px;
}

.ui-site-footer__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--ll-space-8);
}

.ui-site-footer__status {
  display: inline-flex;
  align-items: center;
  gap: var(--ll-space-2);
  margin: 0;
  color: var(--ll-color-text-muted);
  font: 550 var(--ll-text-xs) / 1.2 var(--ll-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.035em;
}

.ui-site-footer__status span {
  width: 0.5rem;
  height: 0.5rem;
  background: #4ea76b;
  border: 2px solid #dff4e5;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(78, 167, 107, 0.12);
}

.ui-site-footer__legal {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--ll-space-5);
}

@media (max-width: 64rem) {
  .ui-site-footer__columns {
    grid-template-columns: repeat(3, minmax(8rem, 1fr));
  }
}

@media (max-width: 44rem) {
  .ui-site-footer__top {
    grid-template-columns: 1fr;
  }

  .ui-site-footer__columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ui-site-footer__bottom {
    align-items: flex-start;
    flex-direction: column;
  }

  .ui-site-footer__legal {
    justify-content: flex-start;
  }
}
</style>
