/**
 * Política de privacidad (estática): una copia completa por idioma.
 * El correo de contacto es un marcador: sustitúyelo antes de publicar.
 */

export function PrivacidadEs() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      <h1 className="text-2xl font-bold text-black dark:text-white">
        Política de privacidad
      </h1>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Última actualización: 8 de octubre de 2026.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        1. Responsable del tratamiento
      </h2>
      <p className="mt-2">
        Debarock Kolektiboa (en adelante, «la organización»). Para cualquier
        cuestión sobre tus datos o para ejercer tus derechos, escribe a{" "}
        <span className="font-semibold">privacidad@debarock-kolektiboa.es</span>{" "}
        (correo provisional: sustituir por el definitivo).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        2. Qué datos recogemos
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>Nombre</strong> y <strong>correo electrónico</strong>{" "}
          (obligatorios al registrarte).
        </li>
        <li>
          <strong>Teléfono</strong> (opcional, si decides añadirlo en tu
          perfil).
        </li>
        <li>
          Datos de actividad de la plataforma: roles asignados (técnico,
          general…), inscripciones a sesiones, propuestas de temas, comentarios
          de tareas y movimiento de caja, en la medida en que uses esas
          funciones.
        </li>
        <li>
          Registros internos de acciones administrativas (qué se hizo y cuándo)
          para poder revisar incidentes.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        3. Para qué los usamos
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Gestionar tu cuenta y tu participación en las Jam Sessions
          (inscripciones, repertorio, materiales y avisos).
        </li>
        <li>
          Enviarte correos operativos: verificación de tu cuenta, restablecer
          contraseña y avisos de la actividad (sesiones, tareas, propuestas).
        </li>
        <li>
          Seguridad de la plataforma: verificación de correo, prevención de
          registros automatizados (reCAPTCHA) y control de permisos.
        </li>
      </ul>
      <p className="mt-2">
        <strong>Base legal:</strong> tu consentimiento (al crear la cuenta y
        aceptar esta política), que puedes retirar en cualquier momento, y el
        interés legítimo en mantener la plataforma segura.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        4. Dónde se guardan y con quién se comparten
      </h2>
      <p className="mt-2">
        Los datos se almacenan en servicios de Google (Firebase Authentication,
        Google Sheets/Drive y Google Apps Script) vinculados a esta
        plataforma. No se venden ni se comparten con terceros para publicidad.
        Google actúa como proveedor tecnológico; más información en su{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          política de privacidad
        </a>
        . El registro usa reCAPTCHA de Google (ver sección de cookies).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        5. Conservación
      </h2>
      <p className="mt-2">
        Los datos se conservan mientras tu cuenta esté activa. Puedes pedir el
        borrado en cualquier momento escribiendo al correo de contacto; se
        eliminará tu cuenta y tus datos personales, conservándose solo los
        registros estrictamente necesarios de las sesiones en las que hayas
        participado (por ejemplo, la lista de asistencia histórica sin tus
        datos de contacto).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        6. Tus derechos
      </h2>
      <p className="mt-2">
        Puedes ejercer los derechos de <strong>acceso</strong>,{" "}
        <strong>rectificación</strong>, <strong>supresión</strong>,{" "}
        <strong>oposición</strong>, <strong>limitación</strong> y{" "}
        <strong>portabilidad</strong> escribiendo al correo de contacto. Si
        consideras que el tratamiento no se ajusta a la normativa, puedes
        reclamar ante la{" "}
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Agencia Española de Protección de Datos
        </a>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        7. Cookies
      </h2>
      <p className="mt-2">Esta plataforma usa solo cookies técnicas:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <code>jam_auth</code> y <code>jam_role</code>: recuerdan que tienes
          sesión iniciada y qué roles ves (caducan a los 30 días). Son
          necesarias para el funcionamiento de la plataforma.
        </li>
        <li>
          reCAPTCHA de Google (widget anti-bots del registro): puede establecer
          cookies propias de Google. Consulta la{" "}
          <a
            href="https://policies.google.com/technologies/cookies"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            política de cookies de Google
          </a>{" "}
          y sus{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            términos del servicio
          </a>
          .
        </li>
      </ul>
      <p className="mt-2">
        No usamos cookies de analítica ni publicitarias, por lo que no se
        muestra un banner de consentimiento: las cookies existentes son
        necesarias para el servicio que solicitas.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        8. Cambios en esta política
      </h2>
      <p className="mt-2">
        Si cambia de forma significativa cómo se tratan los datos, se
        comunicará en la plataforma o por correo a las cuentas registradas.
      </p>
    </div>
  );
}

export function PrivacidadEu() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
      <h1 className="text-2xl font-bold text-black dark:text-white">
        Pribatutasun politika
      </h1>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Azken eguneraketa: 2026ko urriak 8.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        1. Tratamenduaren arduraduna
      </h2>
      <p className="mt-2">
        Debarock Kolektiboa (aurrerantzean, «antolakundea»). Zure datuei buruzko
        edozein kontsultarako edo zure eskubideak erabiltzeko, idatzi{" "}
        <span className="font-semibold">privacidad@debarock-kolektiboa.es</span>{" "}
        (posta behin-behinekoa: ordezkatu behin betikoz argitaratu aurretik).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        2. Zein datu biltzen ditugun
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>Izena</strong> eta <strong>posta elektronikoa</strong>{" "}
          (beharrezkoak izena ematean).
        </li>
        <li>
          <strong>Teléfonoa</strong> (hautazkoa, profilean gehitzea erabakitzen
          baduzu).
        </li>
        <li>
          Plataformako jarduera-datuak: esleitutako rolak (teknikaria,
          nagusia…), saioetako izen-emateak, kantu-proposamenak, zeregalen
          iruzkinak eta mugimendu ekonomikoak, funtzio horiek erabiltzen dituzun
          neurrian.
        </li>
        <li>
          Ekintza administratiboen erregistro barnealdeak (zer egin zen eta noiz)
          gertaerak ikertzeko.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        3. Zertarako erabiltzen ditugun
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          Zure kontua eta Jam Session-etan parte hartzea kudeatzeko
          (izen-emateak, errepertorioa, materiala eta abisuak).
        </li>
        <li>
          Posta operatiboak bidaltzeko: kontuaren egiaztapena, pasahitza
          berreskuratza eta jardueren abisuak (saioak, zeregalak,
          proposamenak).
        </li>
        <li>
          Plataformaren segurtasunerako: posta-egiaztapena, izen-emate
          automatizoen prebentzioa (reCAPTCHA) eta baimenen kontrolea.
        </li>
      </ul>
      <p className="mt-2">
        <strong>Oinarrizko legedia:</strong> zure baimena (kontua sortzean eta
        politika hau onartzean), noiznahi errebokatu dezakezuna, eta plataforma
        seguru mantentzeko interes legitimoa.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        4. Non gordetzen diren eta nori partekatzen zaizkien
      </h2>
      <p className="mt-2">
        Datuak Google-ren zerbitzuetan gordetzen dira (Firebase Authentication,
        Google Sheets/Drive eta Google Apps Script) plataforma honekin lotuta.
        Ez dira saltzen eta ez zaizkie hirugarrenei saltzen publizitaterako.
        Google-hornitzaile teknologiko gisa jarduten du; informazio gehiago
        haren{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          pribatutasun politikan
        </a>
        . Izen-emateak Google-ren reCAPTCHA erabiltzen du (ikusi cookies
        atala).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        5. Kontserbazioa
      </h2>
      <p className="mt-2">
        Datuak zure kontua aktibo dagoen bitartean kontserbatzen dira. Ezabapena
        noiznahi eska dezakezu kontaktura idatziz; zure kontua eta datu
        pertsonalak ezabatuko dira, parte hartu duzun saioetako erregistro
        strictamente beharrezkoak baino ezik kontserbatuz (adibidez, historiaiko
        asistentzia-zerrenda zure kontaktu-daturik gabe).
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        6. Zure eskubideak
      </h2>
      <p className="mt-2">
        <strong>Sarbide</strong>, <strong>zuzenketa</strong>,{" "}
        <strong>ezabapena</strong>, <strong>aurkiketa</strong>,{" "}
        <strong>mugaketa</strong> eta <strong>eramangarritasuna</strong>{" "}
        eskubideak erabil ditzakezu kontaktura idatziz. Tratamendua araudira
        egokitzen ez dela uste baduzu,{" "}
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Datuak Babesteko Espainako Agentzian
        </a>{" "}
        egin dezakezu erreklamazioa.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        7. Cookies
      </h2>
      <p className="mt-2">
        Plataforma honek soilik cookie teknikoak erabiltzen ditu:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <code>jam_auth</code> eta <code>jam_role</code>: saioa hasita
          duzunaz eta zein rol ikusten dituzun gogoratzen dute (30 egunean
          iraungitzen dira). Plataformaren funtzionamendurako beharrezkoak dira.
        </li>
        <li>
          Google-ren reCAPTCHA (izen-ematearen anti-bot widget-ak) Google-ren
          cookie propioak ezar ditzake. Ikusi{" "}
          <a
            href="https://policies.google.com/technologies/cookies"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Google-ren cookie-politika
          </a>{" "}
          eta haren{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            zerbitzu-baldintzak
          </a>
          .
        </li>
      </ul>
      <p className="mt-2">
        Ez dugu analitika- edo publizitate-cookie erabiltzen, beraz ez da
        baimen-bannerrik erakusten: dauden cookie-ak eskatzen ari zaren
        zerbitzurako beharrezkoak dira.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-black dark:text-white">
        8. Aldaketak politika honetan
      </h2>
      <p className="mt-2">
        Datuen tratamendua nabarmen aldatzen bada, plataforman edo posta bidez
        jakinaraziko da kontu erregistratuei.
      </p>
    </div>
  );
}
