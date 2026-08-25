# 🚀 Guía de despliegue — App de Finanzas

Esta guía te lleva de cero a tu app funcionando en internet, conectando
**GitHub → Supabase → Vercel**. No necesitas saber programar: solo copiar,
pegar y hacer clic. Tiempo estimado: **15–20 minutos**.

Vas a hacer 4 cosas en este orden:

1. Subir el código a **GitHub**
2. Crear la base de datos en **Supabase**
3. Desplegar en **Vercel** con las claves de Supabase
4. Crear tu cuenta y empezar a usarla

---

## 1) Subir el código a GitHub

Tienes el proyecto en la carpeta `finanzas` (el .zip que te entregué).
Elige **una** de estas dos formas.

### Opción A — Sin usar la terminal (la más fácil)

1. Descomprime el archivo `finanzas.zip` en tu computador.
2. Entra a <https://github.com/new> y crea un repositorio nuevo:
   - **Repository name:** `finanzas`
   - Déjalo en **Private** (privado) si no quieres que otros lo vean.
   - **No** marques "Add a README" (el proyecto ya trae uno).
   - Clic en **Create repository**.
3. En la página que aparece, haz clic en el enlace
   **"uploading an existing file"**.
4. Arrastra **todo el contenido** de la carpeta `finanzas` (no la carpeta en sí,
   sino los archivos y carpetas de adentro: `app`, `components`, `lib`,
   `supabase`, `package.json`, etc.).
   > ⚠️ No subas la carpeta `node_modules` (el .zip ya viene sin ella).
5. Abajo, haz clic en **Commit changes**.

### Opción B — Con la terminal (si te sientes cómoda con Git)

Dentro de la carpeta del proyecto:

```bash
git init
git add .
git commit -m "App de finanzas"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/finanzas.git
git push -u origin main
```

Reemplaza `TU-USUARIO` por tu nombre de usuario de GitHub.

---

## 2) Crear la base de datos en Supabase

1. Entra a <https://supabase.com/dashboard> y haz clic en **New project**.
2. Completa:
   - **Name:** `finanzas`
   - **Database Password:** crea una contraseña y **guárdala** (la genera por ti,
     puedes copiarla; no la necesitarás en el día a día, pero es bueno tenerla).
   - **Region:** elige la más cercana (por ejemplo *South America (São Paulo)*).
3. Clic en **Create new project** y espera ~2 minutos a que se cree.

### Ejecutar el esquema (crear las tablas)

4. En el menú lateral, entra a **SQL Editor** → **New query**.
5. Abre el archivo `supabase/schema.sql` del proyecto, **copia todo su contenido**
   y pégalo en el editor.
6. Haz clic en **Run** (botón verde, abajo a la derecha).
   Deberías ver *"Success. No rows returned"*. ¡Listo, ya tienes las tablas! ✅

### Copiar tus claves de Supabase

7. Ve a **Project Settings** (ícono de engranaje) → **API**.
8. Anota estos dos valores (los usarás en el paso 3):
   - **Project URL** → algo como `https://xxxxxxxx.supabase.co`
   - **anon public** (en *Project API keys*) → una cadena larga.
   > 🔒 Usa solo la clave **anon public**. Nunca subas la clave *service_role*
   > a GitHub ni a ningún lugar público.

### (Recomendado para uso personal) Entrar sin confirmar el correo

Por defecto, Supabase te pide confirmar tu correo antes de entrar. Para tu app
personal puedes desactivarlo y así entras al toque:

9. Ve a **Authentication** → **Sign In / Providers** → **Email**.
10. Desactiva **Confirm email** y guarda.
    > Si prefieres dejarlo activado, simplemente revisa tu correo y haz clic en
    > el enlace de confirmación después de registrarte.

---

## 3) Desplegar en Vercel

1. Entra a <https://vercel.com/new>.
2. Conecta tu cuenta de GitHub si te lo pide y **importa** el repositorio
   `finanzas`.
3. Antes de desplegar, abre la sección **Environment Variables** y agrega estas
   dos (copiando los valores del paso 2):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | tu **Project URL** de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | tu clave **anon public** |

   > Escribe los nombres **exactamente** así (respeta mayúsculas y guiones bajos).
4. Haz clic en **Deploy** y espera 1–2 minutos.
5. Cuando termine, verás **Congratulations** y un botón para visitar tu app.
   La URL será algo como `https://finanzas-xxxx.vercel.app`.

---

## 4) Crear tu cuenta y empezar

1. Abre la URL de tu app.
2. En la pantalla de inicio, ve a la pestaña **Crear cuenta**, escribe tu correo
   y una contraseña (mínimo 6 caracteres) y regístrate.
   - Si dejaste activada la confirmación por correo, confirma desde tu email y
     luego inicia sesión.
3. Al entrar por primera vez ya tendrás **categorías sugeridas** creadas
   automáticamente. Desde ahí puedes:
   - **Movimientos:** registrar ingresos y gastos.
   - **Presupuestos:** poner un límite mensual por categoría.
   - **Metas:** crear metas de ahorro y hacer aportes.
   - **Resumen:** ver tus gráficos y balance del mes.

¡Eso es todo! 🎉

---

## Preguntas frecuentes

**¿Cómo cambio la moneda?**
Por defecto está en pesos chilenos (CLP). Edita el archivo `lib/utils.ts`, cambia
`CURRENCY_LOCALE` y `CURRENCY_CODE` (ej: `"es-MX"` y `"MXN"`), sube el cambio a
GitHub y Vercel volverá a desplegar solo.

**Hice un cambio en el código, ¿cómo lo actualizo?**
Cada vez que subes cambios a GitHub, Vercel despliega la nueva versión
automáticamente. No tienes que hacer nada más.

**¿Mis datos están seguros?**
Sí. Cada usuario solo puede ver y editar sus propios datos gracias a las políticas
de seguridad (RLS) que activa el `schema.sql`. Tus claves privadas viven en las
variables de entorno de Vercel, no en el código.

**La app dice "Failed to fetch" o no carga datos.**
Casi siempre es porque las variables de entorno en Vercel están mal escritas o
falta ejecutar el `schema.sql` en Supabase. Revisa esos dos pasos.

**¿Puedo agregar más gráficos o campos?**
Claro. Avísame qué quieres y te ayudo a modificar el código.
