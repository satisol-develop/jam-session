import { useId } from "react";

/**
 * Cartel ficticio (SVG) con la identidad Debarock: negro grunge, amarillo
 * #FFE600 y rojo. Se muestra en la portada cuando no hay cartel real, para
 * que nunca se vea un hueco vacío. Los textos por defecto son de ejemplo
 * (sustitúyelos cuando publiques la sesión).
 */
export function CartelFake({
  fecha,
  lugar,
  className = "",
}: {
  /** p. ej. "SÁB 25 OCT · 20:30 H" (por defecto, contenido ficticio). */
  fecha?: string;
  /** p. ej. "Sala Solano" (por defecto, contenido ficticio). */
  lugar?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const idRuido = `r${uid}`;
  const idPuntos = `p${uid}`;

  const textoFecha = (fecha || "SÁB 25 · 20:30 H").toUpperCase();
  const textoLugar = (lugar || "SEDE DEBAROCK").toUpperCase();

  return (
    <svg
      viewBox="0 0 600 800"
      role="img"
      aria-label={`Cartel de la Jam Session: ${textoFecha}, ${textoLugar}`}
      className={className}
    >
      <defs>
        <filter id={idRuido}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <pattern id={idPuntos} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="2.1" fill="#FFE600" />
        </pattern>
      </defs>

      {/* Fondo + grano */}
      <rect width="600" height="800" fill="#0d0d0d" />
      <rect width="600" height="800" filter={`url(#${idRuido})`} opacity="0.09" />

      {/* Mancha roja tras el título */}
      <circle cx="486" cy="236" r="96" fill="#ef4444" />
      <circle cx="486" cy="236" r="96" fill={`url(#${idPuntos})`} opacity="0.25" />

      {/* Púa arriba a la derecha */}
      <g transform="translate(508 118) rotate(18)">
        <path
          d="M0 0 C-26 0 -42 19 -42 40 C-42 68 0 104 0 104 C0 104 42 68 42 40 C42 19 26 0 0 0 Z"
          fill="#FFE600"
        />
        <text
          x="0"
          y="52"
          textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontWeight="700"
          fontSize="26"
          fill="#0a0a0a"
        >
          JS
        </text>
      </g>

      {/* Banda superior */}
      <g transform="rotate(-4 300 84)">
        <rect x="-30" y="54" width="660" height="58" fill="#FFE600" />
        <text
          x="300"
          y="91"
          textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontWeight="700"
          fontSize="21"
          letterSpacing="5"
          fill="#0a0a0a"
        >
          DEBAROCK KOLEKTIBOA PRESENTA
        </text>
      </g>

      {/* Título */}
      <text
        x="40"
        y="302"
        fontFamily="Impact, 'Arial Black', sans-serif"
        fontStyle="italic"
        fontSize="158"
        letterSpacing="-2"
        fill="#ffffff"
      >
        JAM
      </text>
      <text
        x="40"
        y="432"
        fontFamily="Impact, 'Arial Black', sans-serif"
        fontStyle="italic"
        fontSize="130"
        letterSpacing="-1"
        fill="#FFE600"
      >
        SESSION
      </text>
      <rect x="42" y="450" width="452" height="16" fill={`url(#${idPuntos})`} />

      {/* Datos */}
      <text
        x="40"
        y="546"
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        fontSize="40"
        fill="#ffffff"
      >
        {textoFecha}
      </text>
      <text
        x="40"
        y="596"
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        fontSize="34"
        fill="#FFE600"
      >
        {textoLugar}
      </text>
      <text
        x="40"
        y="636"
        fontFamily="'Courier New', monospace"
        fontSize="22"
        fill="rgba(255,255,255,0.75)"
      >
        PUERTAS 20:00 · ENTRADA LIBRE
      </text>

      {/* Sello rojo rotado */}
      <g transform="rotate(-11 486 688)">
        <circle cx="486" cy="688" r="78" fill="#ef4444" />
        <circle
          cx="486"
          cy="688"
          r="70"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeDasharray="7 7"
        />
        <text
          x="486"
          y="676"
          textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontWeight="700"
          fontSize="21"
          fill="#ffffff"
        >
          ¡TRAE TU
        </text>
        <text
          x="486"
          y="704"
          textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontWeight="700"
          fontSize="21"
          fill="#ffffff"
        >
          INSTRUMENTO!
        </text>
      </g>

      {/* Código de barras ficticio */}
      <g transform="translate(40 676)">
        <rect width="230" height="64" fill="#f5f5f5" />
        {[
          0, 6, 14, 17, 26, 30, 38, 48, 52, 58, 68, 74, 78, 88, 96, 100, 110,
          118, 124, 132, 142, 146, 156, 162, 170, 180, 184, 194, 200, 210, 218,
        ].map((x, i) => (
          <rect
            key={x}
            x={x}
            y="8"
            width={i % 3 === 0 ? 5 : i % 2 === 0 ? 3 : 2}
            height="40"
            fill="#0a0a0a"
          />
        ))}
        <text
          x="115"
          y="59"
          textAnchor="middle"
          fontFamily="'Courier New', monospace"
          fontSize="13"
          letterSpacing="3"
          fill="#0a0a0a"
        >
          0 12534 88210
        </text>
      </g>

      {/* Hashtag */}
      <text
        x="40"
        y="772"
        fontFamily="'Courier New', monospace"
        fontWeight="700"
        fontSize="22"
        fill="#FFE600"
      >
        #DebarockKolektiboa
      </text>

      {/* Marco */}
      <rect
        x="14"
        y="14"
        width="572"
        height="772"
        fill="none"
        stroke="#FFE600"
        strokeWidth="3"
      />
    </svg>
  );
}
