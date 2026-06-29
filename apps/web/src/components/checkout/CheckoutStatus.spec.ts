import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { MotionPlugin } from '@vueuse/motion'
import CheckoutStatus from './CheckoutStatus.vue'
import type { StatusState } from './CheckoutStatus.vue'

const mountWithMotion = (state: StatusState) =>
  mount(CheckoutStatus, {
    props: { state },
    global: { plugins: [MotionPlugin] },
  })

const states: StatusState[] = ['processing', 'approved', 'failed', 'expired']

describe('CheckoutStatus', () => {
  it('renderiza para cada estado sem erros', () => {
    for (const state of states) {
      expect(() => mountWithMotion(state)).not.toThrow()
    }
  })

  it('exibe "Pagamento aprovado" no estado approved', () => {
    const wrapper = mountWithMotion('approved')
    expect(wrapper.text()).toContain('Pagamento aprovado')
  })

  it('exibe "Pagamento recusado" no estado failed', () => {
    const wrapper = mountWithMotion('failed')
    expect(wrapper.text()).toContain('Pagamento recusado')
  })

  it('exibe "Processando" no estado processing', () => {
    const wrapper = mountWithMotion('processing')
    expect(wrapper.text()).toContain('Processando')
  })

  it('exibe "expirada" no estado expired', () => {
    const wrapper = mountWithMotion('expired')
    expect(wrapper.text()).toContain('expirada')
  })

  it('aplica classe de fundo verde no estado approved', () => {
    const wrapper = mountWithMotion('approved')
    expect(wrapper.html()).toContain('bg-green-50')
  })

  it('aplica classe de fundo vermelho no estado failed', () => {
    const wrapper = mountWithMotion('failed')
    expect(wrapper.html()).toContain('bg-red-50')
  })

  it('aplica classe de fundo amarelo no estado processing', () => {
    const wrapper = mountWithMotion('processing')
    expect(wrapper.html()).toContain('bg-yellow-50')
  })
})
