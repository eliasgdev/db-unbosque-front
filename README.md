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

## Entornos

| Archivo | Se usa en | `apiUrl` |
|---|---|---|
| `src/environments/environment.development.ts` | `npx ng serve` | `http://localhost:8000/api/v1` |
| `src/environments/environment.ts` | `npx ng build` (producción) | `/api/v1`, servido por el proxy de nginx |

## Despliegue en VM-Front

La carpeta `deploy/` contiene lo necesario para servir el front con nginx en una VM Linux:

| Archivo | Destino en la VM |
|---|---|
| `nginx-contable.conf` | `/etc/nginx/sites-available/contable` (enlazado en `sites-enabled`) |
| `nginx-seguridad.conf` | `/etc/nginx/snippets/contable-seguridad.conf` |
| `desplegar.sh` | Se ejecuta desde este equipo |

nginx sirve el build, entrega `index.html` en las rutas del SPA, agrega cabeceras de seguridad (CSP, `X-Frame-Options`, `nosniff`) y reenvía `/api/` a la API. Antes del primer despliegue, reemplace `<ip-privada-vm-back>` en `nginx-contable.conf`.

Para publicar una versión (solo despliega lo que está en Git):

```bash
VM=<usuario>@<host-vm-front> LLAVE=<ruta-a-la-llave> deploy/desplegar.sh
```

El script compila en modo producción, verifica que el build no apunte a `localhost`, sube los archivos a una carpeta nueva de `/var/www/contable-releases/` y cambia el enlace `/var/www/contable` en un solo paso. Conserva las tres últimas versiones para poder volver atrás.
