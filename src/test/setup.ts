import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => {
    return localStorageMock.store[key] || null
  },
  setItem: (key: string, value: string) => {
    localStorageMock.store[key] = value.toString()
  },
  removeItem: (key: string) => {
    delete localStorageMock.store[key]
  },
  clear: () => {
    localStorageMock.store = {}
  },
  key: (index: number): string | null => {
    const keys = Object.keys(localStorageMock.store)
    return keys[index] || null
  },
  get length(): number {
    return Object.keys(localStorageMock.store).length
  },
  store: {} as Record<string, string>,
}

global.localStorage = localStorageMock as Storage
