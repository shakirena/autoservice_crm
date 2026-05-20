import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoginPage from '../LoginPage.jsx'

describe('LoginPage', () => {
  it('отображает заголовок и подзаголовок', () => {
    render(<LoginPage />)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.getByTestId('login-title')).toHaveTextContent('AutoService CRM')
    expect(screen.getByTestId('login-subtitle')).toBeInTheDocument()
  })
})
