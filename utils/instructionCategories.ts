import type { InstructionCategory } from '~/types/api'

export interface InstructionCategoryOption {
  value: InstructionCategory
  label: string
  group: string
}

export const instructionCategoryOptions: InstructionCategoryOption[] = [
  { value: 'software_engineering', label: 'Software engineering', group: 'Engineering' },
  { value: 'quality_reliability', label: 'Quality & reliability', group: 'Engineering' },
  { value: 'security_privacy', label: 'Security & privacy', group: 'Engineering' },
  { value: 'data_ai', label: 'Data & AI', group: 'Engineering' },
  { value: 'content_brand', label: 'Content & brand', group: 'Marketing' },
  { value: 'growth_acquisition', label: 'Growth & acquisition', group: 'Marketing' },
  { value: 'research_analytics', label: 'Research & analytics', group: 'Marketing' },
  { value: 'product_discovery_strategy', label: 'Product discovery & strategy', group: 'Product & Design' },
  { value: 'product_design_ux', label: 'Product design & UX', group: 'Product & Design' },
  { value: 'delivery_planning', label: 'Delivery & planning', group: 'Product & Design' },
  { value: 'sales', label: 'Sales', group: 'Sales & Customer' },
  { value: 'customer_success_support', label: 'Customer success & support', group: 'Sales & Customer' },
]

export const instructionCategoryLabels = Object.fromEntries(
  instructionCategoryOptions.map(option => [option.value, option.label]),
) as Record<InstructionCategory, string>
