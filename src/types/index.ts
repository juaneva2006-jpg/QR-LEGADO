// ============================================================
// LEGADO GASTROBAR — TypeScript Types (sincronizados con DB)
// ============================================================

export type UserRole = 'cliente' | 'cocina' | 'admin'
export type OrderStatus = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado'
export type PaymentStatus = 'pendiente' | 'procesando' | 'completado' | 'fallido' | 'reembolsado'
export type MesaZona = 'sala' | 'terraza' | 'barra'
export type ProductCategory =
  | 'almuerzos'
  | 'gildas'
  | 'laterio'
  | 'aperitivos'
  | 'frios_ensaladas'
  | 'calientes'
  | 'postres'
  | 'bebidas'

export interface Mesa {
  id: string
  numero: number
  zona: MesaZona
  capacidad: number
  activa: boolean
  qr_token: string
  created_at: string
}

export interface Perfil {
  id: string
  nombre: string
  telefono?: string
  rol: UserRole
  created_at: string
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string
  sesion_token: string
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  descripcion?: string
  precio: number
  categoria: ProductCategory
  imagen_url?: string
  alergenos?: string[]
  disponible: boolean
  destacado: boolean
  orden: number
  ventas_totales: number
  created_at: string
  updated_at: string
}

export interface Pedido {
  id: string
  mesa_id: string
  cliente_id?: string
  estado: OrderStatus
  pago_estado: PaymentStatus
  pago_id?: string
  subtotal: number
  iva: number
  total: number
  notas?: string
  tiempo_preparacion_inicio?: string
  tiempo_entrega?: string
  created_at: string
  updated_at: string
  // Joins
  mesa?: Mesa
  cliente?: Cliente
  items?: PedidoItem[]
}

export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  notas?: string
  created_at: string
  // Joins
  producto?: Producto
}

export interface Factura {
  id: string
  pedido_id: string
  numero_factura?: string
  pdf_url?: string
  sms_enviado: boolean
  sms_sid?: string
  created_at: string
  // Joins
  pedido?: Pedido
}

export interface SugerenciaIA {
  id: string
  tipo: 'producto_popular' | 'zona_rentable' | 'promocion' | 'complementario' | 'horario'
  titulo: string
  contenido: string
  datos_json?: Record<string, unknown>
  prioridad: 1 | 2 | 3
  vista_admin: boolean
  accion_tomada?: string
  created_at: string
}

// ---- Carrito (estado local) ----
export interface CartItem {
  producto: Producto
  cantidad: number
  notas?: string
}

export interface CartState {
  items: CartItem[]
  mesa_id: string | null
  mesa_numero: number | null
  cliente: Cliente | null
  last_updated: number | null
}

// ---- Analytics ----
export interface AnalyticsData {
  total_pedidos: number
  total_facturacion: number
  tiempo_medio_servicio: number // minutos
  mesas_rentables: { mesa_numero: number; zona: MesaZona; total: number }[]
  productos_top: { nombre: string; cantidad: number; categoria: string }[]
  facturacion_por_dia: { fecha: string; total: number }[]
}

// ---- Categorías del menú con metadatos ----
export const CATEGORIAS: Record<
  ProductCategory,
  { label: string; emoji: string; descripcion: string }
> = {
  almuerzos: {
    label: 'Almuerzos',
    emoji: '🥪',
    descripcion: 'Nuestros bocadillos de autor',
  },
  gildas: {
    label: 'Gildas',
    emoji: '🫒',
    descripcion: 'Pinchos clásicos',
  },
  laterio: {
    label: 'Laterío',
    emoji: '🐟',
    descripcion: 'Conservas premium',
  },
  aperitivos: {
    label: 'Aperitivos',
    emoji: '🧀',
    descripcion: 'Para empezar',
  },
  frios_ensaladas: {
    label: 'Fríos y Ensaladas',
    emoji: '🥗',
    descripcion: 'Frescos y sabrosos',
  },
  calientes: {
    label: 'Calientes',
    emoji: '🔥',
    descripcion: 'De cocina, con cariño',
  },
  postres: {
    label: 'Postres',
    emoji: '🍮',
    descripcion: 'El final perfecto',
  },
  bebidas: {
    label: 'Bebidas',
    emoji: '🍷',
    descripcion: 'Para acompañar',
  },
}

// ---- Status helpers ----
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; next?: OrderStatus }
> = {
  pendiente: {
    label: 'Pendiente',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    next: 'en_preparacion',
  },
  en_preparacion: {
    label: 'En Preparación',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    next: 'listo',
  },
  listo: {
    label: 'Listo ✓',
    color: '#10B981',
    bgColor: '#D1FAE5',
    next: 'entregado',
  },
  entregado: {
    label: 'Entregado',
    color: '#6B7280',
    bgColor: '#F3F4F6',
  },
  cancelado: {
    label: 'Cancelado',
    color: '#EF4444',
    bgColor: '#FEE2E2',
  },
}
