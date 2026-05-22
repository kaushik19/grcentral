import { config } from '@vue/test-utils'

// Suppress teleport/transition warnings in tests
config.global.stubs = {
  teleport: true,
  transition: false,
  'transition-group': false,
}
