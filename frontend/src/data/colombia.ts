export type DepartamentoColombia = {
  nombre: string;
  municipios: string[];
};

export const departamentosColombia: DepartamentoColombia[] = [
  {
    nombre: 'Santander',
    municipios: [
      'Bucaramanga',
      'Floridablanca',
      'Girón',
      'Piedecuesta',
      'Barrancabermeja',
      'San Gil',
      'Socorro',
      'Málaga',
      'Lebrija',
    ],
  },
  {
    nombre: 'Antioquia',
    municipios: [
      'Medellín',
      'Bello',
      'Envigado',
      'Itagüí',
      'Rionegro',
      'Apartadó',
      'Turbo',
    ],
  },
  {
    nombre: 'Cundinamarca',
    municipios: [
      'Bogotá D.C.',
      'Soacha',
      'Chía',
      'Zipaquirá',
      'Facatativá',
      'Mosquera',
      'Funza',
    ],
  },
  {
    nombre: 'Valle del Cauca',
    municipios: [
      'Cali',
      'Palmira',
      'Buenaventura',
      'Tuluá',
      'Buga',
      'Jamundí',
      'Cartago',
    ],
  },
  {
    nombre: 'Atlántico',
    municipios: [
      'Barranquilla',
      'Soledad',
      'Malambo',
      'Sabanalarga',
      'Puerto Colombia',
    ],
  },
];