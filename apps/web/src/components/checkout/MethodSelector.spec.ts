import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MethodSelector from './MethodSelector.vue'

describe('MethodSelector', () => {
  it('renderiza todos os métodos disponíveis', () => {
    const wrapper = mount(MethodSelector, {
      props: { methods: ['pix', 'boleto', 'credit_card'], modelValue: '' },
    })
    expect(wrapper.text()).toContain('PIX')
    expect(wrapper.text()).toContain('Boleto')
    expect(wrapper.text()).toContain('Cartão de Crédito')
  })

  it('emite update:modelValue com o método correto ao clicar', async () => {
    const wrapper = mount(MethodSelector, {
      props: { methods: ['pix', 'boleto'], modelValue: '' },
    })
    await wrapper.find('[data-method-id="pix"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue') as string[][]
    expect(emitted).toBeDefined()
    expect(emitted[0][0]).toBe('pix')
  })

  it('emite o método correto para boleto', async () => {
    const wrapper = mount(MethodSelector, {
      props: { methods: ['pix', 'boleto'], modelValue: '' },
    })
    await wrapper.find('[data-method-id="boleto"]').trigger('click')
    const emitted = wrapper.emitted('update:modelValue') as string[][]
    expect(emitted[0][0]).toBe('boleto')
  })

  it('aplica classe de selecionado ao método ativo', () => {
    const wrapper = mount(MethodSelector, {
      props: { methods: ['pix'], modelValue: 'pix' },
    })
    const selected = wrapper.find('[data-method-id="pix"]')
    expect(selected.classes().some((c) => c.includes('primary'))).toBe(true)
  })

  it('renderiza apenas os métodos passados via prop', () => {
    const wrapper = mount(MethodSelector, {
      props: { methods: ['pix'], modelValue: '' },
    })
    expect(wrapper.text()).toContain('PIX')
    expect(wrapper.text()).not.toContain('Boleto')
    expect(wrapper.text()).not.toContain('Cartão')
  })
})
