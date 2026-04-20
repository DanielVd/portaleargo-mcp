import type { RegistroEntry } from "../../src/tools/getTomorrowHomework.js";

export const mockRegistro: RegistroEntry[] = [
  {
    pk: "lesson-1",
    datEvento: "2026-04-17 09:00:00.000",
    isFirmato: true,
    desUrl: null,
    pkDocente: "teacher-1",
    compiti: [
      {
        compito: "Read chapter 5 and answer questions 1-4.",
        dataConsegna: "2026-04-18 00:00:00.000",
      },
      {
        compito: "Optional revision worksheet.",
        dataConsegna: "2026-04-20 00:00:00.000",
      },
    ],
    datGiorno: "2026-04-17 00:00:00.000",
    docente: "Prof.ssa Rossi",
    materia: "Italiano",
    pkMateria: "subject-1",
    attivita: "Antologia",
    ora: 2,
  },
  {
    pk: "lesson-2",
    datEvento: "2026-04-17 11:00:00.000",
    isFirmato: true,
    desUrl: null,
    pkDocente: "teacher-2",
    compiti: [
      {
        compito: "Solve exercises 12, 13, 14 on page 87.",
        dataConsegna: "2026-04-18 00:00:00.000",
      },
    ],
    datGiorno: "2026-04-17 00:00:00.000",
    docente: "Prof. Bianchi",
    materia: "Matematica",
    pkMateria: "subject-2",
    attivita: null,
    ora: 4,
  },
];
