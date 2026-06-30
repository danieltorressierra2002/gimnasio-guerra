# Gimnasio Guerra — Sistema de Gestión de Membresías

App web para gestionar usuarios, pagos mensuales y entrenadores del Gimnasio Guerra.

## Qué incluye

- **Panel de Administrador**: agrega/edita/elimina usuarios, sube su foto, registra
  el mes pagado, marca si tienen entrenador, define método de pago (online/directo)
  y crea su acceso (correo + contraseña).
- **Panel de Usuario**: cada cliente entra con su correo/contraseña y ve su propio
  estado de membresía.
- **Semáforo automático de estado**:
  - 🟢 Verde ("Al día") → faltan más de 5 días para vencer
  - 🟡 Amarillo ("Por vencer") → quedan 5 días o menos
  - 🔴 Rojo ("Vencido") → ya pasó la fecha de vencimiento
  - El cálculo es automático: no hay que cambiar el color a mano, se recalcula
    cada vez que se carga la app según la fecha de hoy.

---

## Paso 1 — Crear el proyecto de Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com) y crea un proyecto nuevo (ej. "gimnasio-guerra").
2. En **Build > Authentication**, activa el método **Correo electrónico/contraseña**.
3. En **Build > Firestore Database**, crea la base de datos (modo producción).
4. En **Configuración del proyecto > Tus apps**, agrega una app **Web** y copia el objeto `firebaseConfig`.
5. Pega esos valores en `src/lib/firebase.js` **y** en `src/components/AdminDashboard.jsx`
   (busca `firebaseConfigSecundaria` — debe ser el mismo proyecto, se usa para poder
   crear usuarios sin cerrar tu sesión de admin).

### Reglas de seguridad de Firestore

En **Firestore Database > Reglas**, reemplaza el contenido por el archivo `firestore.rules`
incluido en este proyecto, y publica. Esto evita que cualquier persona pueda leer o
modificar los datos sin autenticarse.

---

## Paso 2 — Crear el usuario Administrador

Como aún no existe ningún admin, hay que crear el primero manualmente:

1. En **Authentication > Users**, click en "Agregar usuario". Crea uno con tu correo
   y una contraseña segura. Copia el **UID** que se genera.
2. En **Firestore Database**, crea manualmente una colección llamada `perfiles`.
3. Dentro, crea un documento cuyo **ID sea exactamente ese UID**, con estos campos:
   - `rol` (string) = `admin`
   - `nombre` (string) = tu nombre, ej. "Admin Guerra"

Con eso, al iniciar sesión con ese correo entrarás directo al Panel de Administrador.

---

## Paso 3 — Configurar Cloudinary (fotos de usuarios)

1. Crea una cuenta gratuita en [cloudinary.com](https://cloudinary.com).
2. En el Dashboard, copia tu **Cloud name**.
3. Ve a **Settings > Upload** > "Add upload preset". Configúralo como **Unsigned**
   (sin firmar) y dale un nombre, ej. `gimnasio_guerra_fotos`.
4. Abre `src/lib/cloudinary.js` y reemplaza:
   - `CLOUDINARY_CLOUD_NAME` → tu Cloud name
   - `CLOUDINARY_UPLOAD_PRESET` → el nombre del preset que creaste

---

## Paso 4 — Subir el código a GitHub (desde el móvil)

1. Crea un repositorio nuevo en GitHub (ej. `gimnasio-guerra`).
2. Sube todos los archivos de este proyecto a ese repositorio (igual que hiciste con NovaTech).

---

## Paso 5 — Desplegar en Netlify

1. Entra a [netlify.com](https://netlify.com) y crea un nuevo sitio **"Import from Git"**.
2. Conecta tu repositorio `gimnasio-guerra`.
3. Configuración de build:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Despliega. Netlify te dará una URL pública (ej. `algo-random.netlify.app`).

---

## Paso 6 — Agregar tu primer usuario del gimnasio

1. Entra a la app con tu cuenta de admin.
2. Click en el botón **+** (abajo a la derecha).
3. Llena el nombre, sube la foto, define la fecha de inicio de pago (la fecha de
   vencimiento se calcula sola, un mes después), el método de pago y si tiene
   entrenador.
4. Asigna correo y contraseña — con eso, ese usuario ya puede entrar a ver su
   propio estado de membresía.

---

## Cómo funciona el semáforo de colores

El estado se calcula comparando la fecha de hoy con la `fechaVencimiento` guardada
en cada usuario (ver `src/lib/membership.js`):

```
DIAS_ALERTA_AMARILLO = 5

si fechaVencimiento ya pasó           -> 🔴 Vencido
si faltan 5 días o menos para vencer  -> 🟡 Por vencer
si faltan más de 5 días               -> 🟢 Al día
```

Si quieres cambiar cuántos días antes se pone en amarillo, edita el valor
`DIAS_ALERTA_AMARILLO` en `src/lib/membership.js`.

Cuando el admin renueva el pago de un usuario (editando la fecha de inicio en su
ficha), la fecha de vencimiento y el color se recalculan automáticamente.

---

## Estructura del proyecto

```
src/
  components/
    Login.jsx           Pantalla de inicio de sesión
    AdminDashboard.jsx   Panel del administrador (lista, filtros, estadísticas)
    UserDashboard.jsx    Panel del usuario (su propio estado)
    UserCard.jsx         Tarjeta de usuario con barra de estado de color
    UserFormModal.jsx    Formulario para crear/editar usuarios
  contexts/
    AuthContext.jsx      Maneja sesión y rol (admin / usuario)
  lib/
    firebase.js          Configuración de Firebase
    cloudinary.js         Subida de fotos
    membership.js         Lógica de cálculo de estado (verde/amarillo/rojo)
```
