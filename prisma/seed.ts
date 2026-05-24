import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const permisos = {
  SISTEMA_TOTAL: 'sistema.total',
  INSTITUCIONES_VER: 'instituciones.ver',
  INSTITUCIONES_CREAR: 'instituciones.crear',
  INSTITUCIONES_EDITAR: 'instituciones.editar',
  INSTITUCIONES_CAMBIAR_ESTADO: 'instituciones.cambiar_estado',
  ROLES_VER: 'roles.ver',
  ROLES_CREAR: 'roles.crear',
  ROLES_EDITAR: 'roles.editar',
  ROLES_CAMBIAR_ESTADO: 'roles.cambiar_estado',
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_CAMBIAR_ESTADO: 'usuarios.cambiar_estado',
  ESTUDIANTES_VER: 'estudiantes.ver',
  CATEGORIAS_VER: 'categorias.ver',
  CATEGORIAS_CREAR: 'categorias.crear',
  CATEGORIAS_EDITAR: 'categorias.editar',
  CATEGORIAS_CAMBIAR_ESTADO: 'categorias.cambiar_estado',
  TIPOS_RECURSOS_VER: 'tipos_recursos.ver',
  TIPOS_RECURSOS_CREAR: 'tipos_recursos.crear',
  TIPOS_RECURSOS_EDITAR: 'tipos_recursos.editar',
  TIPOS_RECURSOS_CAMBIAR_ESTADO: 'tipos_recursos.cambiar_estado',
  RECURSOS_VER: 'recursos.ver',
  RECURSOS_VER_TODOS_GRADOS: 'recursos.ver_todos_grados',
  RECURSOS_CREAR: 'recursos.crear',
  RECURSOS_EDITAR: 'recursos.editar',
  RECURSOS_CAMBIAR_ESTADO: 'recursos.cambiar_estado',
  RECURSOS_SUBIR_ARCHIVO: 'recursos.subir_archivo',
  FOROS_VER: 'foros.ver',
  FOROS_CREAR: 'foros.crear',
  FOROS_CREAR_PUBLICO: 'foros.crear_publico',
  FOROS_COMENTAR: 'foros.comentar',
  FOROS_CERRAR: 'foros.cerrar',
  FOROS_SUBIR_RECURSO: 'foros.subir_recurso',
  AULA_COLABORATIVA_VER: 'aula_colaborativa.ver',
  AULA_COLABORATIVA_CREAR: 'aula_colaborativa.crear',
  AULA_COLABORATIVA_GESTIONAR: 'aula_colaborativa.gestionar',
  AULA_COLABORATIVA_PARTICIPAR: 'aula_colaborativa.participar',
  AULA_COLABORATIVA_REVISAR: 'aula_colaborativa.revisar',
  REPORTES_VER: 'reportes.ver',
} as const;

const descripcionesPermisos: Record<string, string> = {
  [permisos.SISTEMA_TOTAL]: 'Acceso total sin restricción institucional',
  [permisos.INSTITUCIONES_VER]: 'Ver instituciones permitidas',
  [permisos.INSTITUCIONES_CREAR]: 'Crear instituciones',
  [permisos.INSTITUCIONES_EDITAR]: 'Editar instituciones',
  [permisos.INSTITUCIONES_CAMBIAR_ESTADO]:
    'Inactivar o reactivar instituciones',
  [permisos.ROLES_VER]: 'Ver roles',
  [permisos.ROLES_CREAR]: 'Crear roles',
  [permisos.ROLES_EDITAR]: 'Editar roles',
  [permisos.ROLES_CAMBIAR_ESTADO]: 'Inactivar o reactivar roles',
  [permisos.USUARIOS_VER]: 'Ver usuarios de la institución permitida',
  [permisos.USUARIOS_CREAR]: 'Crear usuarios',
  [permisos.USUARIOS_EDITAR]: 'Editar usuarios',
  [permisos.USUARIOS_CAMBIAR_ESTADO]: 'Inactivar o reactivar usuarios',
  [permisos.ESTUDIANTES_VER]: 'Ver estudiantes de la institución',
  [permisos.CATEGORIAS_VER]: 'Ver categorías',
  [permisos.CATEGORIAS_CREAR]: 'Crear categorías',
  [permisos.CATEGORIAS_EDITAR]: 'Editar categorías',
  [permisos.CATEGORIAS_CAMBIAR_ESTADO]: 'Inactivar o reactivar categorías',
  [permisos.TIPOS_RECURSOS_VER]: 'Ver tipos de recursos',
  [permisos.TIPOS_RECURSOS_CREAR]: 'Crear tipos de recursos',
  [permisos.TIPOS_RECURSOS_EDITAR]: 'Editar tipos de recursos',
  [permisos.TIPOS_RECURSOS_CAMBIAR_ESTADO]:
    'Inactivar o reactivar tipos de recursos',
  [permisos.RECURSOS_VER]: 'Ver recursos',
  [permisos.RECURSOS_VER_TODOS_GRADOS]:
    'Ver recursos publicados de todos los grados escolares',
  [permisos.RECURSOS_CREAR]: 'Crear recursos',
  [permisos.RECURSOS_EDITAR]: 'Editar recursos',
  [permisos.RECURSOS_CAMBIAR_ESTADO]: 'Inactivar o reactivar recursos',
  [permisos.RECURSOS_SUBIR_ARCHIVO]: 'Subir archivos de recursos',
  [permisos.FOROS_VER]: 'Ver foros académicos disponibles',
  [permisos.FOROS_CREAR]: 'Crear foros académicos',
  [permisos.FOROS_CREAR_PUBLICO]:
    'Crear foros visibles para todas las instituciones',
  [permisos.FOROS_COMENTAR]: 'Comentar foros académicos publicados',
  [permisos.FOROS_CERRAR]: 'Cerrar foros para impedir nuevos comentarios',
  [permisos.FOROS_SUBIR_RECURSO]:
    'Subir archivos desde foros y convertirlos en recursos',
  [permisos.AULA_COLABORATIVA_VER]: 'Ver proyectos del aula colaborativa',
  [permisos.AULA_COLABORATIVA_CREAR]: 'Crear proyectos en aula colaborativa',
  [permisos.AULA_COLABORATIVA_GESTIONAR]:
    'Gestionar integrantes, roles y actividades del aula colaborativa',
  [permisos.AULA_COLABORATIVA_PARTICIPAR]:
    'Participar en proyectos y cargar evidencias',
  [permisos.AULA_COLABORATIVA_REVISAR]:
    'Revisar entregas finales y publicar recursos aprobados',
  [permisos.REPORTES_VER]: 'Ver reportes',
};

const rolesBase = [
  {
    nombre: 'superadministrador',
    descripcion: 'Acceso total al sistema',
    permisos: Object.values(permisos),
  },
  {
    nombre: 'administrador',
    descripcion: 'Administrador de una única institución',
    permisos: [
      permisos.INSTITUCIONES_VER,
      permisos.USUARIOS_VER,
      permisos.USUARIOS_CREAR,
      permisos.USUARIOS_EDITAR,
      permisos.USUARIOS_CAMBIAR_ESTADO,
      permisos.ESTUDIANTES_VER,
      permisos.CATEGORIAS_VER,
      permisos.CATEGORIAS_CREAR,
      permisos.CATEGORIAS_EDITAR,
      permisos.CATEGORIAS_CAMBIAR_ESTADO,
      permisos.TIPOS_RECURSOS_VER,
      permisos.TIPOS_RECURSOS_CREAR,
      permisos.TIPOS_RECURSOS_EDITAR,
      permisos.TIPOS_RECURSOS_CAMBIAR_ESTADO,
      permisos.RECURSOS_VER,
      permisos.RECURSOS_VER_TODOS_GRADOS,
      permisos.RECURSOS_CREAR,
      permisos.RECURSOS_EDITAR,
      permisos.RECURSOS_CAMBIAR_ESTADO,
      permisos.RECURSOS_SUBIR_ARCHIVO,
      permisos.FOROS_VER,
      permisos.FOROS_CREAR,
      permisos.FOROS_CREAR_PUBLICO,
      permisos.FOROS_COMENTAR,
      permisos.FOROS_CERRAR,
      permisos.FOROS_SUBIR_RECURSO,
      permisos.AULA_COLABORATIVA_VER,
      permisos.AULA_COLABORATIVA_CREAR,
      permisos.AULA_COLABORATIVA_GESTIONAR,
      permisos.AULA_COLABORATIVA_PARTICIPAR,
      permisos.AULA_COLABORATIVA_REVISAR,
      permisos.REPORTES_VER,
    ],
  },
  {
    nombre: 'docente',
    descripcion: 'Docente de una institución',
    permisos: [
      permisos.ESTUDIANTES_VER,
      permisos.RECURSOS_VER,
      permisos.RECURSOS_VER_TODOS_GRADOS,
      permisos.RECURSOS_CREAR,
      permisos.RECURSOS_SUBIR_ARCHIVO,
      permisos.FOROS_VER,
      permisos.FOROS_CREAR,
      permisos.FOROS_CREAR_PUBLICO,
      permisos.FOROS_COMENTAR,
      permisos.FOROS_CERRAR,
      permisos.FOROS_SUBIR_RECURSO,
      permisos.AULA_COLABORATIVA_VER,
      permisos.AULA_COLABORATIVA_CREAR,
      permisos.AULA_COLABORATIVA_GESTIONAR,
      permisos.AULA_COLABORATIVA_PARTICIPAR,
      permisos.AULA_COLABORATIVA_REVISAR,
      permisos.REPORTES_VER,
    ],
  },
  {
    nombre: 'estudiante',
    descripcion: 'Estudiante de una institución',
    permisos: [
      permisos.RECURSOS_VER,
      permisos.FOROS_VER,
      permisos.FOROS_CREAR,
      permisos.FOROS_COMENTAR,
      permisos.AULA_COLABORATIVA_VER,
      permisos.AULA_COLABORATIVA_PARTICIPAR,
    ],
  },
  {
    nombre: 'usuario administrativo',
    descripcion: 'Usuario administrativo para reportes',
    permisos: [
      permisos.FOROS_VER,
      permisos.FOROS_COMENTAR,
      permisos.FOROS_SUBIR_RECURSO,
      permisos.RECURSOS_VER_TODOS_GRADOS,
      permisos.REPORTES_VER,
    ],
  },
];

async function main() {
  await prisma.gradoEscolar.createMany({
    data: [
      { nombre: 'Sexto', codigo: 'SEXTO', orden: 6 },
      { nombre: 'Séptimo', codigo: 'SEPTIMO', orden: 7 },
      { nombre: 'Octavo', codigo: 'OCTAVO', orden: 8 },
      { nombre: 'Noveno', codigo: 'NOVENO', orden: 9 },
      { nombre: 'Décimo', codigo: 'DECIMO', orden: 10 },
      { nombre: 'Once', codigo: 'ONCE', orden: 11 },
    ],
    skipDuplicates: true,
  });

  const institucion = await prisma.institucion.upsert({
    where: { codigo: 'GLOBAL' },
    update: {
      estado: true,
      nombre: 'Institución Global',
      correo: 'admin@plataforma.edu.co',
      telefono: '0000000000',
      direccion: 'Administración del sistema',
      ciudad: 'Bucaramanga',
      departamento: 'Santander',
    },
    create: {
      nombre: 'Institución Global',
      codigo: 'GLOBAL',
      nit: '000000000-0',
      correo: 'admin@plataforma.edu.co',
      telefono: '0000000000',
      direccion: 'Administración del sistema',
      ciudad: 'Bucaramanga',
      departamento: 'Santander',
      estado: true,
    },
  });

  for (const codigo of Object.values(permisos)) {
    await prisma.permiso.upsert({
      where: { codigo },
      update: { descripcion: descripcionesPermisos[codigo] },
      create: {
        codigo,
        descripcion: descripcionesPermisos[codigo],
      },
    });
  }

  for (const rolBase of rolesBase) {
    const rol = await prisma.rol.upsert({
      where: { nombre: rolBase.nombre },
      update: {
        descripcion: rolBase.descripcion,
        estado: true,
      },
      create: {
        nombre: rolBase.nombre,
        descripcion: rolBase.descripcion,
        estado: true,
      },
    });

    const permisosRol = await prisma.permiso.findMany({
      where: {
        codigo: {
          in: rolBase.permisos,
        },
      },
    });

    await prisma.rolPermiso.deleteMany({
      where: {
        rolId: rol.id,
        permiso: {
          codigo: {
            notIn: rolBase.permisos,
          },
        },
      },
    });

    await prisma.rolPermiso.createMany({
      data: permisosRol.map((permiso) => ({
        rolId: rol.id,
        permisoId: permiso.id,
      })),
      skipDuplicates: true,
    });
  }

  const rolSuperadmin = await prisma.rol.findUniqueOrThrow({
    where: { nombre: 'superadministrador' },
  });

  const correo =
    process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@plataforma.edu.co';
  const documento = process.env.SEED_SUPERADMIN_DOCUMENTO || '0000000001';
  const contrasena = process.env.SEED_SUPERADMIN_PASSWORD || 'Admin123456';

  await prisma.usuario.upsert({
    where: { correo },
    update: {
      nombres: 'Super',
      apellidos: 'Administrador',
      tipoDocumento: 'CC',
      documento,
      genero: 'No especifica',
      activo: true,
      institucionId: institucion.id,
      rolId: rolSuperadmin.id,
    },
    create: {
      nombres: 'Super',
      apellidos: 'Administrador',
      correo,
      tipoDocumento: 'CC',
      documento,
      fechaNacimiento: new Date('1990-01-01T00:00:00.000Z'),
      genero: 'No especifica',
      contrasena: await bcrypt.hash(contrasena, 10),
      activo: true,
      institucionId: institucion.id,
      rolId: rolSuperadmin.id,
    },
  });

  console.log('Seed completado: roles, permisos y superadministrador listos.');
  console.log(`Superadmin: ${correo}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
