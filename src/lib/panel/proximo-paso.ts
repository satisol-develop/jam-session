import type { EstadoPanel } from "@/components/panel/use-panel-status";
import type { Rol } from "@/types";

export interface PasoSiguiente {
  texto: string;
  /** Pestaña del panel donde se hace este paso (undefined = solo protocolo). */
  irA?: string;
}

const EN_ESPERA: PasoSiguiente = {
  texto: "Sesión en borrador: espera a que el General la apruebe. Consulta el protocolo para no perderte ningún paso.",
};

/** Días positivos = faltan; negativos = la fecha ya pasó. */
export function diasPara(fecha: string): number | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

/**
 * Siguiente paso recomendado del rol según el estado real de la sesión
 * (pestaña Inicio). La prioridad sigue el ciclo: preparación → semana →
 * Jam → cierre.
 */
export function proximoPaso(rol: Rol, e: EstadoPanel): PasoSiguiente {
  const ev = e.evento;
  if (!ev) {
    return { texto: "No hay sesión activa. Espera a que se cree el evento del mes." };
  }

  const dias = diasPara(ev.fecha);
  const futura = dias === null || dias >= 0;

  switch (rol) {
    case "admin": {
      if (e.propuestasPendientes > 0) {
        return {
          texto: `${e.propuestasPendientes} propuestas pendientes de resolución del General.`,
          irA: "propuestas",
        };
      }
      if (e.inscripcionesPendientes > 0) {
        return {
          texto: `${e.inscripcionesPendientes} inscripciones sin estado: el Grupo Base debe asignarlas.`,
          irA: "inscripciones",
        };
      }
      if (e.cajaCerrada === false) {
        return {
          texto: "La caja está abierta: revisa movimientos y totales.",
          irA: "caja",
        };
      }
      if (ev.estado === "borrador") {
        return {
          texto:
            "Sesión en borrador: supervisa que tareas, inscripciones y propuestas avanzan.",
          irA: "tareas",
        };
      }
      if (ev.estado === "realizado") {
        return {
          texto:
            "Sesión cerrada: prepara la rotación del próximo mes (antes del día 25).",
          irA: "rotacion",
        };
      }
      return {
        texto: "Repasa el progreso global de tareas del equipo.",
        irA: "tareas",
      };
    }

    case "general": {
      if (ev.estado === "borrador") {
        return {
          texto:
            "Define los datos de la sesión y aprueba para generar las tareas.",
          irA: "sesion",
        };
      }
      if (ev.estado === "aprobado") {
        if (e.propuestasPendientes > 0) {
          return {
            texto: `Valida en bloque las ${e.propuestasPendientes} propuestas pendientes.`,
            irA: "propuestas",
          };
        }
        if (!futura && e.cajaCerrada !== true) {
          return {
            texto: "La Jam ya pasó: audita los fondos y cierra la caja.",
            irA: "auditoria",
          };
        }
        if (e.cajaCerrada === true) {
          return {
            texto: "Caja cerrada: cierra el evento y crea la siguiente sesión.",
            irA: "sesion",
          };
        }
        return {
          texto:
            "Todo en marcha: revisa tareas, Grupo Base y la difusión de la fecha.",
          irA: "tareas",
        };
      }
      return {
        texto: "Sesión archivada: crea la siguiente cuando toque abrir el ciclo.",
        irA: "sesion",
      };
    }

    case "grupo-base": {
      if (ev.estado === "borrador") return EN_ESPERA;
      if (ev.estado === "realizado") {
        return {
          texto: "Sesión cerrada: revisa el repertorio para el próximo mes.",
          irA: "propuestas",
        };
      }
      if (e.inscripcionesPendientes > 0) {
        return {
          texto: `${e.inscripcionesPendientes} inscripciones sin estado: asigna cada músico.`,
          irA: "inscripciones",
        };
      }
      if (!ev.ensayo && dias !== null && dias <= 7) {
        return {
          texto: "≈1 semana antes: fija el ensayo general.",
          irA: "ensayo",
        };
      }
      if (ev.ensayo && !ev.inscripcionesCerradas && dias !== null && dias <= 5) {
        return {
          texto: "Cierra las inscripciones y anuncia la fecha del ensayo.",
          irA: "ensayo",
        };
      }
      if (e.propuestasPendientes > 0) {
        return {
          texto: `${e.propuestasPendientes} propuestas por tener en cuenta para el repertorio.`,
          irA: "propuestas",
        };
      }
      return {
        texto: "Define el repertorio activo y monta la escaleta base.",
        irA: "escaleta",
      };
    }

    case "stage-manager": {
      if (ev.estado === "borrador") return EN_ESPERA;
      if (dias !== null && dias < 0) {
        return {
          texto:
            "La Jam ya pasó: repasa que todos los turnos están en «terminado».",
          irA: "escaleta",
        };
      }
      if (dias !== null && dias <= 2) {
        return {
          texto: "D-1: monta la escaleta base y confirma los intérpretes.",
          irA: "escaleta",
        };
      }
      return {
        texto: "Prepara la escaleta base: turnos y duraciones estimadas.",
        irA: "escaleta",
      };
    }

    case "tecnico": {
      if (ev.estado === "borrador") return EN_ESPERA;
      if (dias !== null && dias <= 2 && dias >= 0) {
        return {
          texto: "D-1: comprueba el equipo y coordina el soundcheck.",
          irA: "instrumentos",
        };
      }
      return {
        texto:
          "Revisa los instrumentos confirmados y planifica microfonías y monitores.",
        irA: "instrumentos",
      };
    }

    case "caja": {
      if (e.cajaCerrada === true) {
        return {
          texto: "Caja cerrada: entrega el fondo y comunica el beneficio al General.",
          irA: "caja",
        };
      }
      if (ev.estado === "borrador") {
        return {
          texto: "Prepara el cambio inicial y los precios de los consumos.",
          irA: "caja",
        };
      }
      if (dias !== null && dias < 0) {
        return {
          texto: "La Jam pasó: cuadra, cuenta el efectivo y cierra la caja.",
          irA: "caja",
        };
      }
      return {
        texto:
          "Durante la Jam: registra consumos, aportaciones del barra y gastos.",
        irA: "caja",
      };
    }

    case "redes": {
      if (dias !== null && dias < 0) {
        return {
          texto: "Post-evento: publica agradecimientos, material y resultados.",
          irA: "difusion",
        };
      }
      if (dias !== null && dias <= 7) {
        return {
          texto:
            "Semana de la Jam: publica el cartel con fecha, lugar y hashtag.",
          irA: "difusion",
        };
      }
      return {
        texto: "Usa el Kit de difusión: texto base y enlace de la sesión.",
        irA: "difusion",
      };
    }
  }
}
