# Viggo Web LOCALOPE

Frontend operativo local para cada parking/proyecto.

## Antes

`legacy/viggo_web` mezclaba administracion general, usuarios, perfiles, proyectos,
operacion local, caja POS, tickets y pensiones en una sola aplicacion.

## Ahora

Este web apunta al API local `viggo-server-api-LOCALOPE` y debe usarse dentro del
parking para operacion diaria:

- Cobro en caja POS.
- Turno, corte e historial de caja.
- Consulta operativa de tickets.
- Pensiones, Pension Pass y movimientos locales.
- Pagos locales/operativos.
- Cuenta del usuario sincronizado.

La administracion de usuarios, perfiles de permisos, proyectos/parkings y catalogos
globales vive en `administrativo/viggo-web-NUBEADMIN`.

## Desarrollo

```bash
npm install
npm run dev
```

En desarrollo apunta por defecto a:

```env
VITE_DEV_API_URL=http://localhost:3002
VITE_DEV_SOCKET_URL=http://localhost:3002
```

El web local intenta iniciar en `3001`. Si ese puerto ya esta ocupado por
NUBEADMIN Web, automaticamente usa `3004`.
