/**
 * Términos de uso (estáticos): una copia completa por idioma.
 */

export function TerminosEs({ privacidad }: { privacidad: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      <h1 className="text-2xl font-bold text-black dark:text-white">
        Términos de uso
      </h1>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Última actualización: 8 de octubre de 2026.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        1. Objeto
      </h2>
      <p className="mt-2">
        Estos términos regulan el uso de la plataforma Jam Session de Debarock
        Kolektiboa: coordinación de sesiones, repertorio, materiales y
        comunicación entre participantes. Al crear una cuenta los aceptas.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        2. Cuentas
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          El registro es <strong>personal e intransferible</strong>: una cuenta
          por participante, con datos reales (nombre y correo).
        </li>
        <li>
          Eres responsable de mantener tu contraseña en secreto y de las
          actividades realizadas desde tu cuenta.
        </li>
        <li>
          Debes verificar tu correo electrónico antes de acceder a «Mi zona».
        </li>
        <li>
          La organización puede dar de baja cuentas que incumplan estos
          términos o que estén inactivas.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        3. Uso aceptable
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Usar la plataforma para la actividad de las Jam Sessions.</li>
        <li>
          No publicar contenido ofensivo, ilegal o que vulnere derechos de
          terceros (por ejemplo, partituras o archivos sin permiso).
        </li>
        <li>
          No intentar acceder a datos de otros participantes ni a funciones
          para las que no tengas rol asignado.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        4. Contenido de los participantes
      </h2>
      <p className="mt-2">
        Los temas propuestos, comentarios y materiales que compartes se usan
        para la gestión interna del repertorio y las sesiones. Al subir
        material declaras que puedes hacerlo.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        5. Datos personales
      </h2>
      <p className="mt-2">
        El tratamiento de tus datos se describe en la{" "}
        <a href={privacidad} className="underline">
          política de privacidad
        </a>
        , que forma parte de estos términos.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        6. Disponibilidad
      </h2>
      <p className="mt-2">
        La plataforma se presta «tal cual»: puede haber interrupciones por
        mantenimiento o fallos del servicio. La organización no garantiza
        disponibilidad continua ni se responsabiliza de usos distintos al
        previsto.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        7. Ley aplicable
      </h2>
      <p className="mt-2">
        Estos términos se rigen por la legislación española. Para cualquier
        controversia serán competentes los juzgados del domicilio del usuario
        consumidor.
      </p>
    </div>
  );
}

export function TerminosEu({ privacidad }: { privacidad: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      <h1 className="text-2xl font-bold text-black dark:text-white">
        Erabilera-baldintzak
      </h1>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Azken eguneraketa: 2026ko urriak 8.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        1. Helburua
      </h2>
      <p className="mt-2">
        Baldintza hauek Debarock Kolektiboaren Jam Session plataformaren
        erabilera arautzen dute: saioen koordinazioa, errepertorioa, materiala
        eta partaideen arteko komunikazioa. Kontua sortzean onartzen dituzu.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        2. Kontuak
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Izen-ematea <strong>pertsonala eta besterenezina</strong> da: kontu
          bat partaide bakoitzeko, benetako datuekin (izena eta posta).
        </li>
        <li>
          Pasahitza isilik mantentzeaz eta zure kontutik egiten diren
          jardueraz arduratzen zara.
        </li>
        <li>
          Zure posta elektronikoa egiaztatu behar duzu «Nire eremua»
          sartu aurretik.
        </li>
        <li>
          Antolakundeak baldintza hauek urratzen dituzten edo inaktiboak dauden
          kontuak baja ditzake.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        3. Erabilera onargarria
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Plataforma Jam Session-en jarduerarako erabiltzea.
        </li>
        <li>
          Eduki ofentsibo, ilegal edo hirugarrenen eskubideak urratzen dituen
          ezer argitaratzea (adibidez, baimenik gabeko partiturak edu
          fitxategiak).
        </li>
        <li>
          Beste partaideen datuetara edo zureari esleituta ez dauden
          funtzioetara sartzeko ahaleginik ez egitea.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        4. Partaideen edukia
      </h2>
      <p className="mt-2">
        Proposatutako kantuak, iruzkinak eta partekatzen dituzun materialak
        errepertorioaren eta saioen kudeaketarako erabiltzen dira. Materiala
        igoz gero, horretarako baimena duzula adierazten duzu.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        5. Datu pertsonalak
      </h2>
      <p className="mt-2">
        Zure datuen tratamendua{" "}
        <a href={privacidad} className="underline">
          pribatutasun politikan
        </a>{" "}
        azaltzen da, baldintza hauen parte dena.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        6. Erabilgarritasuna
      </h2>
      <p className="mt-2">
        Plataforma «dagoen bezala» eskaintzen da: etenak egon daitezke
        mantentze-lanak edo zerbitzu-akatsengatik. Antolakundeak ez du
        etengabeko erabilgarritasunik bermatzen, eta ez da aurreikusitakoak
        ez den erabilurako erantzule.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        7. Aplikatzekoa den legea
      </h2>
      <p className="mt-2">
        Baldintza hauek Espainiako legeriak arautzen dituzte. Eztabaida
        guztietarako kontsumitzailearen helbideko epaitegiak izango dira
        eskudun.
      </p>
    </div>
  );
}
