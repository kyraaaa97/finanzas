# 💰 Finanzas

App web para gestionar tus finanzas personales: ingresos y gastos, categorías con
presupuesto mensual, dashboard con gráficos, metas de ahorro y movimientos
recurrentes.

Construida con **Next.js 14 (App Router)**, **Supabase** (base de datos + login)
y desplegable en **Vercel**. Cada usuario ve solo sus propios datos gracias a las
políticas de seguridad por fila (RLS) de Supabase.

## Funcionalidades

- 🔐 Registro e inicio de sesión con correo y contraseña.
- 💸 Registro de ingresos y gastos con categoría, descripción y fecha.
- 🗂️ Categorías personalizables (color, tipo) con presupuesto mensual.
- 📊 Dashboard: balance del mes, ingresos vs gastos (6 meses) y gastos por categoría.
- 🎯 Metas de ahorro con barra de avance y aportes.
- 🔁 Movimientos recurrentes (sueldo, arriendo, suscripciones) que puedes registrar con un clic.
- 💵 Formato de moneda en pesos chilenos (CLP) por defecto, fácil de cambiar en `lib/utils.ts`.

## Cómo desplegar

Sigue la guía paso a paso incluida en **GUIA-DESPLIEGUE.md**. En resumen:

1. Sube este proyecto a un repositorio de **GitHub**.
2. En **Supabase**, crea un proyecto y ejecuta el archivo `supabase/schema.sql`
   en el *SQL Editor*.
3. En **Vercel**, importa el repositorio y agrega las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. ¡Despliega y crea tu cuenta!

## Ejecutar en tu computador (opcional)

```bash
npm install
cp .env.local.example .env.local   # y completa tus valores de Supabase
npm run dev
```

Abre http://localhost:3000

## Estructura

```
app/
  login/              → pantalla de login/registro
  (app)/
    dashboard/        → resumen con gráficos
    transactions/     → ingresos y gastos
    budgets/          → categorías y presupuestos
    goals/            → metas de ahorro y recurrentes
components/           → componentes de UI
lib/supabase/         → clientes de Supabase (navegador, servidor, middleware)
lib/                  → tipos y utilidades (formato de moneda, fechas)
supabase/schema.sql   → esquema de base de datos + seguridad (RLS)
```

## Cambiar la moneda

Edita `lib/utils.ts` y ajusta `CURRENCY_LOCALE` y `CURRENCY_CODE`
(por ejemplo `"es-AR"` / `"ARS"`, `"es-MX"` / `"MXN"`, `"en-US"` / `"USD"`).
