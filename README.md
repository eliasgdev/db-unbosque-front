# DB Unbosque Front

Aplicación web de solo lectura del sistema contable: plan de cuentas, asientos, Estado de Resultados y Balance General. Angular con Atomic Design.

```
src/app/
  components/
    atoms/        input, select
    molecules/    search-field, stat-card
    organisms/    data-table, selector-contexto
    templates/    main-layout
  pages/          plan-cuentas, asientos, estado-resultados, balance-general
  core/
    models/
    services/
```

```bash
npm install
npx ng serve
```

La URL de la API se configura en `src/environments/environment.ts`.
