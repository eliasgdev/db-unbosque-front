# DB Unbosque Front

Aplicación web del sistema contable, en Angular con Atomic Design. Consulta el plan de cuentas, los asientos, el Estado de Resultados y el Balance General, y permite registrar datos a través de la API:

| Sección | Consultar | Registrar |
|---|---|---|
| Resumen | Indicadores del periodo, asientos recientes y ecuación contable | — |
| Plan de cuentas | Árbol jerárquico con filtros | Nueva cuenta (sugiere tipo y rubro del padre) |
| Asientos | Lista del periodo y movimientos | Nuevo asiento, edición en borrador y contabilización |
| Terceros | Terceros y centros de costo | Nuevo tercero y nuevo centro de costo |
| Empresas | Empresas y periodos | Nueva empresa, apertura y cierre de periodo |
| Estado de resultados / Balance general | Reportes calculados por la API | — |

La API no expone operaciones de borrado: los registros se corrigen editando el asiento mientras está en borrador.

```
src/app/
  components/
    atoms/        icono
    molecules/    aviso-api, buscador, encabezado, estado-vacio, stat-card
    organisms/    data-table, estado-financiero, modal, selector-contexto, asiento-form
    templates/    main-layout (menú lateral y barra de empresa/periodo)
  pages/          inicio, plan-cuentas, asientos, terceros, empresas, estado-resultados, balance-general
  core/
    models/
    services/     contabilidad (API), seleccion (empresa y periodo de trabajo), notificacion
    utils/        arbol, errores, formato (montos es-CO en la moneda de la empresa, fechas)
  shared/pipes/   monto, fecha, etiqueta
```

```bash
npm install
npx ng serve
```

La URL de la API se configura en `src/environments/environment.ts`.

La empresa y el periodo elegidos se recuerdan en el navegador; si no hay selección, se toma la primera empresa y su periodo abierto más reciente. Los montos se muestran en la moneda base de la empresa. La interfaz sigue el modo claro u oscuro del sistema, y los reportes tienen un formato de impresión.

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
