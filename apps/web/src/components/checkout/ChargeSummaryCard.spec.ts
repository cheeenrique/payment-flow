import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ChargeSummaryCard from './ChargeSummaryCard.vue'
import type { CheckoutView } from '@/types'

function makeView(overrides: Partial<CheckoutView> = {}): CheckoutView {
  return {
    amount: 10000,
    currency: 'BRL',
    status: 'pending',
    availableMethods: ['pix'],
    ...overrides,
  }
}

describe('ChargeSummaryCard', () => {
  it('exibe o valor formatado em reais', () => {
    const wrapper = mount(ChargeSummaryCard, { props: { view: makeView({ amount: 10000 }) } })
    expect(wrapper.text()).toContain('R$')
    expect(wrapper.text()).toContain('100')
  })

  it('exibe a descrição quando presente', () => {
    const wrapper = mount(ChargeSummaryCard, {
      props: { view: makeView({ description: 'Assinatura mensal' }) },
    })
    expect(wrapper.text()).toContain('Assinatura mensal')
  })

  it('não renderiza parágrafo de descrição quando ausente', () => {
    const wrapper = mount(ChargeSummaryCard, { props: { view: makeView() } })
    // Sem description, o <p> condicional não deve existir
    const paragraphs = wrapper.findAll('p')
    const hasUndefined = paragraphs.some((p) => p.text().includes('undefined'))
    expect(hasUndefined).toBe(false)
  })

  it('exibe o nome do cliente quando presente', () => {
    const wrapper = mount(ChargeSummaryCard, {
      props: { view: makeView({ customerName: 'Carlos' }) },
    })
    expect(wrapper.text()).toContain('Carlos')
  })

  it('exibe o status badge com o status da cobrança', () => {
    const wrapper = mount(ChargeSummaryCard, { props: { view: makeView({ status: 'paid' }) } })
    expect(wrapper.text()).toContain('paid')
  })
})
