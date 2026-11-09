import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  imports: false, // keep imports explicit
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Stoic Quotes',
    description: 'A daily quote from Marcus Aurelius, Seneca and Epictetus, with a quiet place to reflect.',
    permissions: ['storage', 'alarms'],
    optional_permissions: ['notifications'],
    action: {
      default_title: 'Stoic Quotes',
      default_icon: { 16: 'icon/16.png', 32: 'icon/32.png' },
    },
    commands: {
      _execute_action: {
        suggested_key: { default: 'Alt+Shift+S' },
        description: 'Open today’s quote',
      },
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'stoic@skuflic.com',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
        gecko_android: { strict_min_version: '142.0' },
      },
    }),
  }),
  zip: {
    artifactTemplate: 'stoic-{{version}}-{{browser}}.zip',
    sourcesTemplate: 'stoic-{{version}}-sources.zip',
  },
});
