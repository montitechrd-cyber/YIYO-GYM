export type RolUsuario = "admin" | "entrenador" | "cliente";
export type EstadoCliente = "prospecto" | "activo" | "pausado" | "inactivo";
export type ObjetivoFitness =
  | "perder_grasa"
  | "ganar_musculo"
  | "recomposicion"
  | "fuerza"
  | "salud"
  | "tonificar";
export type NivelExperiencia = "principiante" | "intermedio" | "avanzado";
export type GrupoMuscular =
  | "pecho"
  | "espalda"
  | "hombros"
  | "biceps"
  | "triceps"
  | "gluteos"
  | "cuadriceps"
  | "femorales"
  | "gemelos"
  | "core"
  | "cardio"
  | "cuerpo_completo";
export type EstadoSesion = "programada" | "completada" | "omitida" | "cancelada";
export type EstadoPedido =
  | "nuevo"
  | "confirmado"
  | "enviado"
  | "entregado"
  | "cancelado";
export type EstadoSuscripcion =
  | "activa"
  | "pendiente"
  | "cancelada"
  | "vencida"
  | "prueba";
export type TipoNotificacion =
  | "mensaje"
  | "rutina"
  | "sesion"
  | "pago"
  | "progreso"
  | "sistema";

export type Perfil = {
  id: string;
  rol: RolUsuario;
  nombre_completo: string;
  correo: string;
  telefono: string | null;
  avatar_url: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  ciudad: string | null;
  bio: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type Cliente = {
  id: string;
  perfil_id: string;
  entrenador_id: string | null;
  estado: EstadoCliente;
  origen: string | null;
  etiquetas: string[];
  objetivo: ObjetivoFitness | null;
  nivel: NivelExperiencia | null;
  notas: string | null;
  fecha_alta: string;
  creado_en: string;
  actualizado_en: string;
};

export type NotaCliente = {
  id: string;
  cliente_id: string;
  autor_id: string;
  contenido: string;
  creado_en: string;
};

export type Evaluacion = {
  id: string;
  cliente_id: string;
  fecha: string;
  altura_cm: number | null;
  peso_kg: number | null;
  grasa_pct: number | null;
  medidas: Record<string, number>;
  objetivos: string | null;
  condiciones_medicas: string | null;
  lesiones: string | null;
  medicamentos: string | null;
  alergias_alimentarias: string | null;
  dias_disponibles: number | null;
  equipo_disponible: string | null;
  habitos_sueno: string | null;
  nivel_estres: string | null;
  fotos: string[];
  creado_en: string;
};

export type Ejercicio = {
  id: string;
  nombre: string;
  /** Encabeza la biblioteca, por encima del orden habitual. */
  destacado: boolean;
  grupo: GrupoMuscular;
  equipo: string | null;
  nivel: NivelExperiencia;
  instrucciones: string | null;
  consejos: string | null;
  video_url: string | null;
  imagen_url: string | null;
  creado_por: string | null;
  publico: boolean;
  creado_en: string;
};

export type CategoriaPrograma = "nivel" | "objetivo";

export type Rutina = {
  id: string;
  nombre: string;
  descripcion: string | null;
  entrenador_id: string | null;
  cliente_id: string | null;
  es_plantilla: boolean;
  semanas: number;
  dias_por_semana: number;
  activa: boolean;
  creado_en: string;
  actualizado_en: string;
  /** Programa del catálogo que trae la plataforma. No es de nadie. */
  es_sistema: boolean;
  categoria: CategoriaPrograma | null;
  nivel: NivelExperiencia | null;
  emoji: string | null;
  duracion_desde: number | null;
  duracion_hasta: number | null;
  resumen: string | null;
  frecuencia: string | null;
  orden: number;
  /** Desde cuándo entrena esto la clienta: fija la semana del ciclo. */
  fecha_inicio: string | null;
  /** Plantilla de la que salió esta copia. */
  origen_id: string | null;
};

export type RutinaDia = {
  id: string;
  rutina_id: string;
  numero: number;
  nombre: string;
  notas: string | null;
};

export type TipoBloque = "ejercicio" | "descanso" | "etiqueta";

export type RutinaEjercicio = {
  id: string;
  dia_id: string;
  tipo: TipoBloque;
  /** Null en los bloques de descanso y de etiqueta. */
  ejercicio_id: string | null;
  /** Texto del bloque de etiqueta. */
  texto: string | null;
  orden: number;
  series: number;
  repeticiones: string;
  /** En un bloque de descanso, es la duración de la pausa. */
  descanso_seg: number;
  peso_sugerido: string | null;
  notas: string | null;
  /** Los bloques con el mismo número forman un circuito. */
  grupo: number | null;
  grupo_repeticiones: number;
};

export type TipoSesion = "entrenamiento" | "alimentacion";

export type Sesion = {
  id: string;
  cliente_id: string;
  entrenador_id: string | null;
  rutina_dia_id: string | null;
  titulo: string;
  fecha: string;
  hora: string | null;
  duracion_min: number;
  estado: EstadoSesion;
  notas: string | null;
  creado_en: string;
  tipo_sesion: TipoSesion;
  plan_alimentacion_id: string | null;
};

export type RegistroEntrenamiento = {
  id: string;
  sesion_id: string | null;
  cliente_id: string;
  fecha: string;
  duracion_min: number | null;
  esfuerzo_rpe: number | null;
  sensacion: string | null;
  notas: string | null;
  creado_en: string;
};

export type SerieRegistrada = {
  id: string;
  registro_id: string;
  ejercicio_id: string;
  numero_serie: number;
  repeticiones: number | null;
  peso_kg: number | null;
  rpe: number | null;
  completada: boolean;
};

export type Progreso = {
  id: string;
  cliente_id: string;
  fecha: string;
  peso_kg: number | null;
  grasa_pct: number | null;
  musculo_pct: number | null;
  medidas: Record<string, number>;
  fotos: string[];
  notas: string | null;
  creado_en: string;
};

export type Conversacion = {
  id: string;
  cliente_id: string;
  entrenador_id: string;
  ultimo_mensaje_en: string;
  creado_en: string;
};

export type Mensaje = {
  id: string;
  conversacion_id: string;
  autor_id: string;
  contenido: string;
  adjunto_url: string | null;
  leido: boolean;
  creado_en: string;
};

export type Notificacion = {
  id: string;
  perfil_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  cuerpo: string | null;
  enlace: string | null;
  leida: boolean;
  creado_en: string;
};

export type Plan = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_mensual: number;
  moneda: string;
  beneficios: string[];
  paypal_plan_id: string | null;
  destacado: boolean;
  activo: boolean;
  orden: number;
  creado_en: string;
};

export type Suscripcion = {
  id: string;
  cliente_id: string;
  plan_id: string;
  estado: EstadoSuscripcion;
  paypal_suscripcion_id: string | null;
  inicio: string | null;
  proximo_cobro: string | null;
  cancelada_en: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type Pago = {
  id: string;
  suscripcion_id: string | null;
  cliente_id: string;
  monto: number;
  moneda: string;
  estado: string;
  paypal_pago_id: string | null;
  fecha: string;
};

// ---------------------------------------------------------------------
// Alimentación
// ---------------------------------------------------------------------
export type CategoriaAlimento =
  | "proteina"
  | "carbohidrato"
  | "grasa"
  | "verdura"
  | "fruta"
  | "lacteo"
  | "legumbre"
  | "bebida"
  | "otro";

export type UnidadAlimento = "g" | "ml" | "unidad";

export type Alimento = {
  id: string;
  nombre: string;
  categoria: CategoriaAlimento;
  unidad: UnidadAlimento;
  /** Por 100 g / 100 ml, o por pieza si `unidad` es «unidad». */
  calorias: number;
  proteina_g: number;
  carbohidratos_g: number;
  grasa_g: number;
  fibra_g: number;
  gramos_por_unidad: number | null;
  marca: string | null;
  creado_por: string | null;
  publico: boolean;
  creado_en: string;
};

export type PlanAlimentacion = {
  id: string;
  /** Null en las plantillas del catálogo, que no son de ninguna clienta. */
  cliente_id: string | null;
  entrenador_id: string | null;
  nombre: string;
  descripcion: string | null;
  calorias_objetivo: number | null;
  proteina_objetivo_g: number | null;
  carbohidratos_objetivo_g: number | null;
  grasa_objetivo_g: number | null;
  activo: boolean;
  inicio: string;
  creado_en: string;
  actualizado_en: string;
  es_sistema: boolean;
  objetivo: ObjetivoFitness | null;
  emoji: string | null;
  resumen: string | null;
  orden: number;
  /** Calorías con las que se escribieron las cantidades de la plantilla. */
  calorias_base: number | null;
  origen_id: string | null;
};

export type PlanDia = {
  id: string;
  plan_id: string;
  numero: number;
  nombre: string;
  notas: string | null;
};

export type PlanComida = {
  id: string;
  dia_id: string;
  nombre: string;
  orden: number;
  hora: string | null;
};

export type ComidaAlimento = {
  id: string;
  comida_id: string;
  alimento_id: string;
  cantidad: number;
  orden: number;
  notas: string | null;
};

export type RegistroComida = {
  id: string;
  cliente_id: string;
  comida_id: string;
  fecha: string;
  cumplida: boolean;
  notas: string | null;
  creado_en: string;
};

export type Producto = {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  especificaciones: string[];
  cuidado: string | null;
  /** Vacío significa talla única. */
  tallas: string[];
  precio: number;
  imagen_url: string;
  /** Lo que falta validar antes de anunciarlo. Solo lo ve el personal. */
  notas_internas: string | null;
  activo: boolean;
  orden: number;
  creado_en: string;
};

export type Pedido = {
  id: string;
  /** Número corto para hablarlo por WhatsApp. */
  numero: number;
  cliente_id: string | null;
  nombre: string;
  telefono: string;
  correo: string | null;
  entrega: string | null;
  notas: string | null;
  total: number;
  estado: EstadoPedido;
  avisado_whatsapp: boolean;
  creado_en: string;
};

export type PedidoItem = {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  nombre: string;
  talla: string | null;
  cantidad: number;
  precio_unitario: number;
};

type Tabla<Fila, Insertar = Partial<Fila>> = {
  Row: Fila;
  Insert: Insertar;
  Update: Partial<Fila>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      perfiles: Tabla<Perfil>;
      productos: Tabla<Producto>;
      pedidos: Tabla<Pedido>;
      pedido_items: Tabla<PedidoItem>;
      clientes: Tabla<Cliente>;
      notas_cliente: Tabla<NotaCliente>;
      evaluaciones: Tabla<Evaluacion>;
      ejercicios: Tabla<Ejercicio>;
      rutinas: Tabla<Rutina>;
      rutina_dias: Tabla<RutinaDia>;
      rutina_ejercicios: Tabla<RutinaEjercicio>;
      sesiones: Tabla<Sesion>;
      registros_entrenamiento: Tabla<RegistroEntrenamiento>;
      series_registradas: Tabla<SerieRegistrada>;
      progreso: Tabla<Progreso>;
      conversaciones: Tabla<Conversacion>;
      mensajes: Tabla<Mensaje>;
      notificaciones: Tabla<Notificacion>;
      planes: Tabla<Plan>;
      suscripciones: Tabla<Suscripcion>;
      pagos: Tabla<Pago>;
      alimentos: Tabla<Alimento>;
      planes_alimentacion: Tabla<PlanAlimentacion>;
      plan_dias: Tabla<PlanDia>;
      plan_comidas: Tabla<PlanComida>;
      comida_alimentos: Tabla<ComidaAlimento>;
      registro_comidas: Tabla<RegistroComida>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      rol_usuario: RolUsuario;
      estado_cliente: EstadoCliente;
      objetivo_fitness: ObjetivoFitness;
      nivel_experiencia: NivelExperiencia;
      grupo_muscular: GrupoMuscular;
      estado_sesion: EstadoSesion;
      estado_suscripcion: EstadoSuscripcion;
      tipo_notificacion: TipoNotificacion;
    };
    CompositeTypes: Record<string, never>;
  };
};
