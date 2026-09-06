# HR Compass · Axontia RRHH

Plataforma SaaS multiempresa para gestión de RRHH y control de jornada, con un motor de alertas de cumplimiento laboral español.

## Arquitectura

- `src/pages`: composición de pantallas y casos de uso de interfaz.
- `src/components`: componentes compartidos y sistema visual.
- `src/hooks`: sesión, empresa activa y autorización en cliente.
- `src/lib`: lógica de dominio pura y utilidades de infraestructura local.
- `src/integrations/supabase`: cliente tipado de Supabase.
- `supabase/migrations`: esquema, funciones y políticas RLS; estas políticas son la frontera real de autorización.

El aislamiento multi-tenant se basa en `companies` y `company_members`. La interfaz oculta operaciones según el rol, pero la seguridad no depende del navegador: las operaciones sensibles deben validarse también mediante RLS o funciones SQL con comprobación explícita de pertenencia y rol.

## Desarrollo local

Requisitos: Node.js 20 o superior y npm.

```sh
cp .env.example .env.local
npm ci
npm run dev
```

Nunca expongas la `service_role` en variables `VITE_*`.

## Calidad

```sh
npm run check
```

El comando ejecuta comprobación de tipos, lint, tests y build de producción.

## Motor de cumplimiento

El motor genera alertas orientativas sobre fichajes incompletos, jornadas superiores al umbral configurado y descansos entre jornadas inferiores a doce horas. Las referencias normativas proceden del artículo 34 del Estatuto de los Trabajadores y los rangos económicos del artículo 40.1 de la LISOS.

El resultado no sustituye una calificación jurídica: convenios colectivos, jornadas especiales, distribución irregular, reincidencia y criterios de graduación pueden cambiar el análisis y la sanción efectiva.

## Despliegue

La aplicación genera un sitio estático con `npm run build`; configura en el proveedor las variables de Supabase y una regla SPA que redirija rutas desconocidas a `index.html`.
