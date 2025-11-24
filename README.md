# Frontend-Syntara

En este repositorio solo se encuentra el frontend de la aplicación, para su uso completo se debe usar los repositorios del backend y database.

### Core Framework & Lenguajes
| Tecnología | Versión | Descripción |
| :--- | :--- | :--- |
| **Angular CLI** | `^20.3.8` | Herramienta de línea de comandos para Angular. |
| **Angular Core/Common** | `^20.3.0` | Framework principal de la aplicación. |
| **TypeScript** | `~5.9.2` | Superset de JavaScript utilizado. |

### Librerías Clave
| Librería | Versión | Uso en el proyecto |
| :--- | :--- | :--- |
| **Chart.js** | `^4.5.1` | Generación de gráficas de precios y tendencias. |
| **chartjs-adapter-date-fns**| `^3.0.0` | Adaptador de fechas para las gráficas. |
| **RxJS** | `~7.8.0` | Manejo de programación reactiva y flujos de datos. |
| **Zone.js** | `~0.15.0` | Detección de cambios en Angular. |
## 🚀 Instalación y Despliegue

Sigue estos pasos para ejecutar la aplicación en un entorno local:

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd syntara-frontend
    ```

2.  **Instalar dependencias (NPM):**
    Asegúrate de estar en la carpeta raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```
    > **Nota:** Si encuentras conflictos de dependencias debido a las versiones estrictas, puedes usar:
    > ```bash
    > npm install --legacy-peer-deps
    > ```

3.  **Ejecutar el servidor de desarrollo:**
    ```bash
    ng serve
    ```

4.  **Visualizar:**
    Navega a `http://localhost:4200/` en tu navegador. La aplicación se recargará automáticamente si cambias algún archivo fuente.
5.  **Conexión con Backend:**
    En la seccion carpeta
    ```bash
    \syntara-frontend-master\syntara-frontend-master\src\app\api.service.ts
    ```
    Modifica la ip-back por la ip de la maquina que tenga contenido el Backend y el port un puerto libre tanto de la maquina con el Frontend y la del Backend.
   

    
Backend: https://github.com/sophieMjs/syntara-backend/tree/master

Database: https://github.com/calderonDavid/Base-de-Datos-MongoDB-Syntara/tree/main 
