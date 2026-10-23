# Dependencias privadas e imágenes Docker

Seguimiento: https://github.com/AlunzaDev/viggo-server-app-REFACTO/issues/71

Los paquetes @alunzadev se descargan de GitHub Packages. El .npmrc versionado
solo contiene el registro; nunca se agregan tokens al repositorio.

## Preparar acceso una vez en la máquina de construcción

Autenticar npm con un token clásico de GitHub que tenga read:packages y acceso
a los paquetes privados de AlunzaDev:

```sh
npm login --scope=@alunzadev --auth-type=legacy --registry=https://npm.pkg.github.com
```

Las credenciales quedan en el .npmrc del usuario. Si la organización usa SSO,
el token debe estar autorizado. Este archivo puede contener otras credenciales:
BuildKit lo monta temporalmente, no se copia ni se pasa como ARG o ENV.
En CI se recomienda generar un archivo de autenticación dedicado temporal.

## Construir con Compose

En PowerShell, desde este repositorio:

```powershell
$env:NPMRC_FILE = Join-Path $env:USERPROFILE '.npmrc'
docker compose build frontend
```

En Linux/macOS:

```sh
export NPMRC_FILE="$HOME/.npmrc"
docker compose build frontend
```

NPMRC_FILE apunta a un archivo fuera del repositorio. Si no se define,
Compose busca .npmrc.auth, excluido de Git y del contexto de Docker.
El secreto npmrc solo se concede durante la construcción. En los backends
se usa tanto para instalar dependencias de compilación como de ejecución.

También se debe proporcionar FRONTEND_ENV_FILE con la configuración pública de
Vite para cada instalación. Los valores VITE_* terminan en el JavaScript del
navegador y no deben contener secretos. La imagen final solo contiene Nginx y
los archivos compilados.

Las dependencias compartidas se fijan en package-lock.json desde GitHub Packages:
viggo-ui 0.4.0 y viggo-contracts 0.1.2, sin archivos externos de SHARED.

## Instalar imágenes ya construidas

Distribuir las imágenes mediante un registro privado o docker save / docker load.
Configurar las variables *_IMAGE del Compose con sus etiquetas y usar:

```sh
docker compose up -d --no-build
```

Para un registro privado, hacer login de Docker y descargar las imágenes antes.
El equipo de destino no necesita token de npm/GitHub Packages para ejecutar las
imágenes ya construidas. Si se usa GHCR para las imágenes, su autenticación de
Docker se configura por separado. Se necesita conexión para descargar imágenes,
no para reinstalar paquetes npm durante el arranque.

Construir para la arquitectura del equipo de destino (por ejemplo linux/amd64
o linux/arm64). La configuración y los volúmenes de cada parking son propios de
esa instalación; no se incluyen en la imagen.
