import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/common/StatusBadge.vue'

describe('StatusBadge', () => {
  // ── Renderização básica ──────────────────────────────────────────────────

  it('renderiza o texto do status no DOM', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'paid' } })
    expect(wrapper.text()).toContain('paid')
  })

  // ── Verde: paid, approved, issued ────────────────────────────────────────

  it('aplica classe verde para status "paid"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'paid' } })
    expect(wrapper.classes().some(c => c.includes('green'))).toBe(true)
  })

  it('aplica classe verde para status "approved"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'approved' } })
    expect(wrapper.classes().some(c => c.includes('green'))).toBe(true)
  })

  it('aplica classe verde para status "issued"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'issued' } })
    expect(wrapper.classes().some(c => c.includes('green'))).toBe(true)
  })

  // ── Amarelo: pending, processing, requested, awaiting_payment ─────────────

  it('aplica classe amarela para status "pending"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'pending' } })
    expect(wrapper.classes().some(c => c.includes('yellow'))).toBe(true)
  })

  it('aplica classe amarela para status "processing"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'processing' } })
    expect(wrapper.classes().some(c => c.includes('yellow'))).toBe(true)
  })

  it('aplica classe amarela para status "requested"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'requested' } })
    expect(wrapper.classes().some(c => c.includes('yellow'))).toBe(true)
  })

  it('aplica classe amarela para status "awaiting_payment"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'awaiting_payment' } })
    expect(wrapper.classes().some(c => c.includes('yellow'))).toBe(true)
  })

  // ── Vermelho: failed, expired, canceled ──────────────────────────────────

  it('aplica classe vermelha para status "failed"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'failed' } })
    expect(wrapper.classes().some(c => c.includes('red'))).toBe(true)
  })

  it('aplica classe vermelha para status "expired"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'expired' } })
    expect(wrapper.classes().some(c => c.includes('red'))).toBe(true)
  })

  it('aplica classe vermelha para status "canceled"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'canceled' } })
    expect(wrapper.classes().some(c => c.includes('red'))).toBe(true)
  })
})
