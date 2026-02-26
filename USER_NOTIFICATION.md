# RE-FIX: Scroll, Rendimiento y Rango

Tras un análisis exhaustivo, he realizado tres mejoras críticas para garantizar que el scroll funcione y que la experiencia sea fluida:

1. **Eliminación de Recorte de Scrollbar:** He movido el padding del contenedor externo al interno. Antes, el padding externo empujaba los scrollbars fuera de la pantalla (literalmente invisible). Ahora están donde deben estar.
2. **Optimización de Rendimiento:** He modificado el motor de renderizado del fondo. Ahora solo dibuja las líneas de cuadrícula necesarias según el zoom, lo que evita que el navegador se bloquee con miles de elementos.
3. **Expansión a 3 Años:** Por defecto, el Gantt ahora se expande **3 años en el futuro**. Esto asegura que incluso en la vista "Año", tengas margen para desplazarte.
4. **Drag-to-Scroll Robusto:** He actualizado el cálculo del arrastre con coordenadas de pantalla reales para evitar saltos bruscos.

**Nota:** Si estás en vista "Año", notarás que el rango es pequeño (unos pocos cientos de píxeles) porque 3 años a escala macro ocupan poco. Prueba el zoom "Semana" o "Mes" para sentir la potencia del scroll.

Prueba de nuevo, ahora debería ser imposible que se bloquee.
