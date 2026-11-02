#!/usr/bin/env bash
# Compila el front y lo publica en VM-Front sin dejar el sitio a medias:
# sube a una carpeta nueva y cambia el enlace /var/www/contable de un solo paso.
#
# Uso: VM=<usuario>@<host-vm-front> LLAVE=<ruta-a-la-llave> deploy/desplegar.sh
set -euo pipefail

VM="${VM:?Defina VM=usuario@host}"
LLAVE="${LLAVE:?Defina LLAVE=ruta/a/la/llave.pem}"
VERSION="$(date +%Y%m%d%H%M%S)-$(git rev-parse --short HEAD)"
DESTINO="/var/www/contable-releases/$VERSION"
SSH=(ssh -i "$LLAVE" "$VM")

cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
  echo "Hay cambios sin commit; despliegue solo lo que está en Git." >&2
  exit 1
fi

npx ng build --configuration production
if grep -q 'localhost:8000' dist/db-unbosque-front/browser/*.js; then
  echo "El build apunta a localhost:8000; revise src/environments." >&2
  exit 1
fi

"${SSH[@]}" "rm -rf /tmp/contable-front && mkdir -p /tmp/contable-front"
scp -q -i "$LLAVE" -r dist/db-unbosque-front/browser/. "$VM:/tmp/contable-front/"
"${SSH[@]}" "set -e
  sudo mkdir -p /var/www/contable-releases
  sudo mv /tmp/contable-front '$DESTINO'
  sudo chown -R root:www-data '$DESTINO' && sudo chmod -R u=rwX,g=rX,o= '$DESTINO'
  [ -L /var/www/contable ] || sudo rm -rf /var/www/contable   # primer despliegue: era una carpeta
  sudo ln -sfn '$DESTINO' /var/www/contable.nuevo && sudo mv -T /var/www/contable.nuevo /var/www/contable
  ls -1dt /var/www/contable-releases/* | tail -n +4 | xargs -r sudo rm -rf
  sudo nginx -t && sudo systemctl reload nginx"

echo "Publicada la versión $VERSION"
