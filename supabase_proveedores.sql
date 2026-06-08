-- Copia y pega esto en el SQL Editor de tu Dashboard de Supabase

CREATE TABLE IF NOT EXISTS proveedores_facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor TEXT NOT NULL,
  numero_factura TEXT,
  fecha DATE NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  archivo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proveedores_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES proveedores_facturas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cantidad NUMERIC(10, 2) NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas de Seguridad (RLS) opcionales (permitir acceso anon para el entorno de desarrollo)
ALTER TABLE proveedores_facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a proveedores_facturas" ON proveedores_facturas FOR ALL USING (true);
CREATE POLICY "Permitir todo a proveedores_items" ON proveedores_items FOR ALL USING (true);
