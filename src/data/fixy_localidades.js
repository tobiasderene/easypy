// fixy_localidades.js
// Tabla local de ciudades cubiertas por Fixy con su CP.
// Se usa el primer CP por ciudad (deduplicado).
// Fuente: api/v2/listarCps de Fixy — actualizar si agregan cobertura.

const FIXY_LOCALIDADES = [
  { localidad: "Asunción",               cp: 1209, provincia: "ASUNCION"     },
  { localidad: "Areguá",                 cp: 2000, provincia: "Central"      },
  { localidad: "Luque",                  cp: 2060, provincia: "Central"      },
  { localidad: "Ypacaraí",               cp: 2102, provincia: "Central"      },
  { localidad: "San Lorenzo",            cp: 2160, provincia: "Central"      },
  { localidad: "Fernando de la Mora",    cp: 2300, provincia: "Central"      },
  { localidad: "Capiatá",                cp: 2560, provincia: "Central"      },
  { localidad: "San Antonio",            cp: 2580, provincia: "Central"      },
  { localidad: "Lambaré",                cp: 2600, provincia: "Central"      },
  { localidad: "Guarambaré",             cp: 2640, provincia: "Central"      },
  { localidad: "Villeta",                cp: 2660, provincia: "Central"      },
  { localidad: "Ypané",                  cp: 2670, provincia: "Central"      },
  { localidad: "Ñemby",                  cp: 2700, provincia: "Central"      },
  { localidad: "Itauguá",                cp: 2740, provincia: "Central"      },
  { localidad: "José Augusto Saldívar",  cp: 2760, provincia: "Central"      },
  { localidad: "Nueva Italia",           cp: 2780, provincia: "Central"      },
  { localidad: "Limpio",                 cp: 3120, provincia: "Central"      },
  { localidad: "Villa Elisa",            cp: 3310, provincia: "Central"      },
  { localidad: "Mariano Roque Alonso",   cp: 3360, provincia: "Central"      },
  { localidad: "Ciudad del Este",        cp: 4500, provincia: "Alto Paraná"  },
  { localidad: "Ayolas",                 cp: 6100, provincia: "Itapúa"       },
  { localidad: "Coronel Bogado",         cp: 6200, provincia: "Itapúa"       },
  { localidad: "Carmen del Paraná",      cp: 6300, provincia: "Itapúa"       },
  { localidad: "Fram",                   cp: 6400, provincia: "Itapúa"       },
  { localidad: "Capitán Miranda",        cp: 6500, provincia: "Itapúa"       },
  { localidad: "Encarnación",            cp: 6600, provincia: "Itapúa"       },
  { localidad: "Puerto Pdte. Franco",    cp: 9000, provincia: "Alto Paraná"  },
  { localidad: "Hernandarias",           cp: 9020, provincia: "Alto Paraná"  },
  { localidad: "Minga Guazú",            cp: 9050, provincia: "Alto Paraná"  },
];

/**
 * Busca ciudades por nombre (case-insensitive, parcial).
 * @param {string} query
 * @returns {{ localidad: string, cp: number, provincia: string }[]}
 */
export function buscarLocalidad(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return FIXY_LOCALIDADES.filter(loc => {
    const name = loc.localidad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return name.includes(q);
  }).slice(0, 8);
}

/**
 * Obtiene el CP de una ciudad exacta.
 * @param {string} localidad
 * @returns {number | null}
 */
export function getCpByLocalidad(localidad) {
  const loc = FIXY_LOCALIDADES.find(
    l => l.localidad.toLowerCase() === localidad.toLowerCase()
  );
  return loc ? loc.cp : null;
}

export default FIXY_LOCALIDADES;