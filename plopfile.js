// Plop.js Configuration - Rivest Platform
// Run with: pnpm plop

export default function (plop) {
  // Helper functions
  plop.setHelper('upperCase', (text) => text.toUpperCase())
  plop.setHelper('lowerCase', (text) => text.toLowerCase())
  plop.setHelper('kebabCase', (text) =>
    text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase()
  )

  // ============================================
  // COMPONENT GENERATOR
  // ============================================
  plop.setGenerator('component', {
    description: 'Loo uus React komponent',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Komponendi nimi (PascalCase):',
        validate: (value) => {
          if (!value) return 'Nimi on kohustuslik'
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Kasuta PascalCase formaati (nt: MyComponent)'
          }
          return true
        },
      },
      {
        type: 'list',
        name: 'type',
        message: 'Komponendi tüüp:',
        choices: [
          { name: 'Lihtne komponent', value: 'simple' },
          { name: 'Vormi komponent', value: 'form' },
          { name: 'Tabeli komponent', value: 'table' },
          { name: 'Dialoogi komponent', value: 'dialog' },
          { name: 'Kaardi komponent', value: 'card' },
        ],
      },
      {
        type: 'input',
        name: 'folder',
        message: 'Kaust (src/components/...):',
        default: '',
      },
      {
        type: 'confirm',
        name: 'withTests',
        message: 'Lisa testid?',
        default: false,
      },
    ],
    actions: (data) => {
      const basePath = data.folder
        ? `apps/web/src/components/${data.folder}/{{kebabCase name}}`
        : `apps/web/src/components/{{kebabCase name}}`

      const actions = [
        {
          type: 'add',
          path: `${basePath}/{{kebabCase name}}.tsx`,
          templateFile: `plop-templates/component/${data.type}.tsx.hbs`,
        },
        {
          type: 'add',
          path: `${basePath}/index.ts`,
          templateFile: 'plop-templates/component/index.ts.hbs',
        },
      ]

      if (data.withTests) {
        actions.push({
          type: 'add',
          path: `apps/web/__tests__/components/{{kebabCase name}}.test.tsx`,
          templateFile: 'plop-templates/component/test.tsx.hbs',
        })
      }

      return actions
    },
  })

  // ============================================
  // PAGE GENERATOR
  // ============================================
  plop.setGenerator('page', {
    description: 'Loo uus Next.js leht',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Lehe nimi (kebab-case):',
        validate: (value) => {
          if (!value) return 'Nimi on kohustuslik'
          return true
        },
      },
      {
        type: 'list',
        name: 'layout',
        message: 'Layout:',
        choices: [
          { name: 'Dashboard (autentitud)', value: 'dashboard' },
          { name: 'Auth (login/register)', value: 'auth' },
          { name: 'Public (avalik)', value: 'public' },
        ],
      },
      {
        type: 'list',
        name: 'type',
        message: 'Lehe tüüp:',
        choices: [
          { name: 'Lihtne leht', value: 'simple' },
          { name: 'Nimekiri (tabel)', value: 'list' },
          { name: 'Detailvaade', value: 'detail' },
          { name: 'Vorm', value: 'form' },
        ],
      },
      {
        type: 'confirm',
        name: 'withDynamicRoute',
        message: 'Lisa dünaamiline route ([id])?',
        default: false,
        when: (answers) => answers.type === 'detail',
      },
    ],
    actions: (data) => {
      const layoutFolder =
        data.layout === 'dashboard'
          ? '(dashboard)'
          : data.layout === 'auth'
          ? '(auth)'
          : '(public)'

      const actions = [
        {
          type: 'add',
          path: `apps/web/src/app/${layoutFolder}/{{name}}/page.tsx`,
          templateFile: `plop-templates/page/${data.type}.tsx.hbs`,
        },
      ]

      if (data.withDynamicRoute) {
        actions.push({
          type: 'add',
          path: `apps/web/src/app/${layoutFolder}/{{name}}/[id]/page.tsx`,
          templateFile: 'plop-templates/page/detail-dynamic.tsx.hbs',
        })
      }

      return actions
    },
  })

  // ============================================
  // HOOK GENERATOR
  // ============================================
  plop.setGenerator('hook', {
    description: 'Loo uus React hook',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Hooki nimi (ilma "use" eesliiteta):',
        validate: (value) => {
          if (!value) return 'Nimi on kohustuslik'
          return true
        },
      },
      {
        type: 'list',
        name: 'type',
        message: 'Hooki tüüp:',
        choices: [
          { name: 'Lihtne hook', value: 'simple' },
          { name: 'Query hook (TanStack Query)', value: 'query' },
          { name: 'Mutation hook', value: 'mutation' },
          { name: 'State hook (Zustand)', value: 'zustand' },
        ],
      },
    ],
    actions: (data) => {
      return [
        {
          type: 'add',
          path: 'apps/web/src/hooks/use-{{kebabCase name}}.ts',
          templateFile: `plop-templates/hook/${data.type}.ts.hbs`,
        },
      ]
    },
  })

  // ============================================
  // API ROUTE GENERATOR
  // ============================================
  plop.setGenerator('api', {
    description: 'Loo uus API route',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'API route nimi (kebab-case):',
        validate: (value) => {
          if (!value) return 'Nimi on kohustuslik'
          return true
        },
      },
      {
        type: 'checkbox',
        name: 'methods',
        message: 'HTTP meetodid:',
        choices: [
          { name: 'GET', value: 'GET', checked: true },
          { name: 'POST', value: 'POST' },
          { name: 'PUT', value: 'PUT' },
          { name: 'DELETE', value: 'DELETE' },
          { name: 'PATCH', value: 'PATCH' },
        ],
      },
      {
        type: 'confirm',
        name: 'withDynamicRoute',
        message: 'Lisa dünaamiline route ([id])?',
        default: false,
      },
    ],
    actions: (data) => {
      const actions = [
        {
          type: 'add',
          path: 'apps/web/src/app/api/{{name}}/route.ts',
          templateFile: 'plop-templates/api/route.ts.hbs',
        },
      ]

      if (data.withDynamicRoute) {
        actions.push({
          type: 'add',
          path: 'apps/web/src/app/api/{{name}}/[id]/route.ts',
          templateFile: 'plop-templates/api/route-dynamic.ts.hbs',
        })
      }

      return actions
    },
  })

  // ============================================
  // FEATURE MODULE GENERATOR
  // ============================================
  plop.setGenerator('feature', {
    description: 'Loo täielik feature moodul (leht + komponendid + hook)',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Feature nimi (PascalCase, nt: Projects):',
        validate: (value) => {
          if (!value) return 'Nimi on kohustuslik'
          return true
        },
      },
      {
        type: 'input',
        name: 'plural',
        message: 'Mitmuslik nimi (nt: Projects -> projectid):',
      },
      {
        type: 'input',
        name: 'singular',
        message: 'Ainsuslik nimi (nt: Project -> projekt):',
      },
    ],
    actions: [
      // Page
      {
        type: 'add',
        path: 'apps/web/src/app/(dashboard)/{{kebabCase plural}}/page.tsx',
        templateFile: 'plop-templates/page/list.tsx.hbs',
      },
      // Detail page
      {
        type: 'add',
        path: 'apps/web/src/app/(dashboard)/{{kebabCase plural}}/[id]/page.tsx',
        templateFile: 'plop-templates/page/detail-dynamic.tsx.hbs',
      },
      // Component folder
      {
        type: 'add',
        path: 'apps/web/src/components/{{kebabCase plural}}/{{kebabCase name}}-table.tsx',
        templateFile: 'plop-templates/component/table.tsx.hbs',
      },
      {
        type: 'add',
        path: 'apps/web/src/components/{{kebabCase plural}}/{{kebabCase name}}-form.tsx',
        templateFile: 'plop-templates/component/form.tsx.hbs',
      },
      {
        type: 'add',
        path: 'apps/web/src/components/{{kebabCase plural}}/index.ts',
        template: `export * from './{{kebabCase name}}-table'\nexport * from './{{kebabCase name}}-form'\n`,
      },
      // Hook
      {
        type: 'add',
        path: 'apps/web/src/hooks/use-{{kebabCase plural}}.ts',
        templateFile: 'plop-templates/hook/query.ts.hbs',
      },
    ],
  })
}
