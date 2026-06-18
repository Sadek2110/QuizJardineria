# Proyecto: Plataforma de cuestionarios online para profesores y alumnos

## 1. Idea general del proyecto

La idea principal del proyecto es desarrollar una página web educativa donde un profesor pueda crear, gestionar y publicar cuestionarios para sus alumnos. Los alumnos, previamente registrados en la plataforma, podrán acceder a su dashboard personal, elegir los cuestionarios disponibles, realizarlos una única vez y enviar sus respuestas.

Una vez enviado un cuestionario, el sistema calculará automáticamente la nota del alumno sobre 10, teniendo en cuenta el número total de preguntas y las respuestas correctas. Esa nota quedará registrada en una base de datos para que tanto el alumno como el profesor puedan consultarla posteriormente.

El profesor tendrá acceso a un panel de administración desde el que podrá gestionar los cuestionarios, revisar las notas obtenidas por cada alumno, administrar los usuarios registrados y comunicarse con los alumnos mediante mensajes generales o individuales.

El objetivo del proyecto es crear una plataforma sencilla, funcional y útil para entornos educativos, facilitando la evaluación online y el seguimiento del rendimiento de los alumnos.

---

## 2. Roles de usuario

La aplicación tendrá dos roles principales:

### Profesor

El profesor será el usuario con permisos de administración. Tendrá acceso a un dashboard desde el que podrá gestionar toda la plataforma.

### Alumno

El alumno será el usuario que podrá registrarse, acceder a los cuestionarios publicados, responderlos y consultar sus notas.

---

## 3. Funcionalidades del profesor

El profesor tendrá un panel de control con las siguientes funcionalidades:

### Gestión de cuestionarios

El profesor podrá realizar un CRUD completo de cuestionarios:

* Crear nuevos cuestionarios.
* Editar cuestionarios existentes.
* Eliminar cuestionarios.
* Ver el listado completo de cuestionarios creados.
* Activar o desactivar cuestionarios para que estén disponibles o no para los alumnos.

Cada cuestionario podrá tener varias preguntas, y cada pregunta podrá tener varias respuestas posibles, indicando cuál es la respuesta correcta.

### Gestión de preguntas

Dentro de cada cuestionario, el profesor podrá:

* Añadir preguntas.
* Editar preguntas.
* Eliminar preguntas.
* Añadir varias opciones de respuesta.
* Marcar la opción correcta.
* Definir el número total de preguntas del cuestionario.

### Visualización de notas

El profesor podrá consultar las notas obtenidas por los alumnos en cada cuestionario.

Podrá ver información como:

* Nombre del alumno.
* Correo electrónico.
* Nombre del cuestionario realizado.
* Número de respuestas correctas.
* Número total de preguntas.
* Nota final sobre 10.
* Fecha de realización del cuestionario.

### Gestión de alumnos

El profesor tendrá una sección para administrar los usuarios con rol de alumno.

Desde esta sección podrá:

* Ver todos los alumnos registrados.
* Editar datos básicos de los alumnos.
* Eliminar alumnos.
* Consultar el historial de notas de cada alumno.
* Ver qué cuestionarios ha realizado cada alumno.

### Mensajes a los alumnos

El profesor podrá enviar mensajes a los alumnos mediante una sección de comunicación.

Habrá dos tipos de mensajes:

* Mensajes generales para todos los alumnos.
* Mensajes individuales para un alumno concreto.

Estos mensajes podrán utilizarse para avisos, recordatorios, instrucciones o comunicación directa entre profesor y alumno.

---

## 4. Funcionalidades del alumno

El alumno tendrá un dashboard personal desde el que podrá acceder a sus funcionalidades principales.

### Registro e inicio de sesión

El alumno podrá registrarse en la plataforma utilizando:

* Nombre de usuario.
* Correo electrónico real.
* Contraseña.

El correo electrónico será necesario para identificar correctamente al alumno y poder relacionar sus notas con su cuenta.

Después del registro, el alumno podrá iniciar sesión con sus credenciales.

### Realización de cuestionarios

El alumno podrá ver una lista de cuestionarios disponibles publicados por el profesor.

Cada alumno solo podrá realizar cada cuestionario una vez. Una vez enviado, el cuestionario quedará bloqueado para ese alumno y no podrá volver a responderlo.

Durante la realización del cuestionario, el alumno seleccionará una respuesta por cada pregunta y, al finalizar, enviará el cuestionario.

### Cálculo automático de la nota

Cuando el alumno envíe el cuestionario, el sistema calculará automáticamente su nota.

La nota se calculará sobre 10 usando la siguiente fórmula:

Nota = respuestas correctas / número total de preguntas × 10

Por ejemplo, si un cuestionario tiene 20 preguntas y el alumno acierta 15:

15 / 20 × 10 = 7,5

La nota final será guardada en la base de datos junto con la información del alumno y del cuestionario realizado.

### Consulta de notas

El alumno podrá consultar sus notas desde su perfil o dashboard.

Podrá ver:

* Cuestionarios realizados.
* Nota obtenida en cada cuestionario.
* Fecha en la que realizó cada cuestionario.
* Número de respuestas correctas.
* Número total de preguntas.

### Perfil del alumno

El alumno podrá modificar algunos datos de su perfil, como:

* Nombre de usuario.
* Contraseña.
* Foto de perfil, si se implementa.
* Datos básicos de la cuenta.

El correo electrónico podría quedar bloqueado o requerir una validación especial para cambiarlo, ya que será un dato importante para identificar al usuario.

### Comunicación con el profesor

El alumno podrá comunicarse con el profesor mediante una sección de mensajes.

La comunicación podrá ser:

* General, dentro de una sección de grupo.
* Individual, mediante mensajes privados con el profesor.

Esta sección permitirá resolver dudas sobre los cuestionarios, recibir avisos o mantener una comunicación básica dentro de la plataforma.

---

## 5. Sistema de evaluación

Cada cuestionario tendrá un número determinado de preguntas.

Cada pregunta tendrá una o varias opciones de respuesta, pero solo una será correcta.

Cuando el alumno envíe el cuestionario, el sistema comparará sus respuestas con las respuestas correctas almacenadas en la base de datos.

Después, calculará la nota final sobre 10.

### Fórmula de cálculo

Nota final = número de respuestas correctas / número total de preguntas × 10

La nota podrá guardarse con uno o dos decimales.

Ejemplo:

* Total de preguntas: 10
* Respuestas correctas: 8
* Nota final: 8 / 10 × 10 = 8

Otro ejemplo:

* Total de preguntas: 12
* Respuestas correctas: 9
* Nota final: 9 / 12 × 10 = 7,5

---

## 6. Reglas importantes del sistema

La plataforma deberá cumplir las siguientes reglas:

* Un alumno solo puede realizar cada cuestionario una vez.
* El profesor puede crear, editar y eliminar cuestionarios.
* El profesor puede ver las notas de todos los alumnos.
* El alumno solo puede ver sus propias notas.
* Los alumnos deben estar registrados para acceder a los cuestionarios.
* El sistema debe diferenciar claramente entre rol de profesor y rol de alumno.
* La nota debe calcularse automáticamente al enviar el cuestionario.
* Las respuestas y resultados deben quedar guardados en la base de datos.
* El profesor debe poder comunicarse con los alumnos.
* El alumno debe poder modificar su perfil.

---

## 7. Posibles secciones de la página

La aplicación podría organizarse en las siguientes secciones:

### Página principal

Página de bienvenida con información básica sobre la plataforma y botones para iniciar sesión o registrarse.

### Login

Formulario para iniciar sesión.

### Registro

Formulario para que los alumnos puedan crear una cuenta.

### Dashboard del profesor

Panel principal del profesor con acceso a:

* Gestión de cuestionarios.
* Gestión de preguntas.
* Gestión de alumnos.
* Consulta de notas.
* Mensajes.
* Perfil.

### Dashboard del alumno

Panel principal del alumno con acceso a:

* Cuestionarios disponibles.
* Cuestionarios realizados.
* Notas obtenidas.
* Mensajes.
* Perfil.

### Sección de cuestionarios

Listado de cuestionarios disponibles para los alumnos.

### Sección de notas

Listado de calificaciones del alumno o, en el caso del profesor, notas de todos los alumnos.

### Sección de mensajes

Zona de comunicación entre profesor y alumnos.

### Perfil

Sección donde cada usuario puede consultar o modificar sus datos personales.

---

## 8. Base de datos recomendada

La base de datos podría tener las siguientes tablas principales:

### usuarios

Guarda la información de los usuarios registrados.

Campos recomendados:

* id
* nombre_usuario
* email
* password
* rol
* fecha_registro

### cuestionarios

Guarda los cuestionarios creados por el profesor.

Campos recomendados:

* id
* titulo
* descripcion
* profesor_id
* activo
* fecha_creacion

### preguntas

Guarda las preguntas de cada cuestionario.

Campos recomendados:

* id
* cuestionario_id
* texto_pregunta

### respuestas

Guarda las posibles respuestas de cada pregunta.

Campos recomendados:

* id
* pregunta_id
* texto_respuesta
* es_correcta

### intentos

Guarda cada cuestionario realizado por un alumno.

Campos recomendados:

* id
* alumno_id
* cuestionario_id
* respuestas_correctas
* total_preguntas
* nota
* fecha_realizacion

### respuestas_alumno

Guarda las respuestas seleccionadas por el alumno.

Campos recomendados:

* id
* intento_id
* pregunta_id
* respuesta_id

### mensajes

Guarda los mensajes entre profesor y alumnos.

Campos recomendados:

* id
* emisor_id
* receptor_id
* mensaje
* tipo
* fecha_envio

---

## 9. Objetivo final

El objetivo final del proyecto es crear una plataforma educativa completa donde el profesor pueda gestionar cuestionarios y evaluar a los alumnos de forma automática, mientras que los alumnos puedan realizar pruebas online, consultar sus notas y comunicarse con el profesor.

La aplicación debe ser clara, sencilla de usar y segura, separando correctamente las funciones de profesor y alumno mediante roles.

Este proyecto permite trabajar conceptos importantes de desarrollo web como autenticación, roles de usuario, CRUD, bases de datos relacionales, formularios, validaciones, gestión de sesiones, cálculo automático de resultados y diseño de dashboards.
