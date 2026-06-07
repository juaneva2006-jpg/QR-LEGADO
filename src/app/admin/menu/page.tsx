'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit3, Trash2, Eye, EyeOff, Star, StarOff,
  Save, X, Upload, Search
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { Producto, ProductCategory } from '@/types'
import { CATEGORIAS } from '@/types'
import toast from 'react-hot-toast'

// ============================================================
// ADMIN MENÚ — CRUD completo de productos
// ============================================================

const CATEGORIAS_ARRAY = Object.entries(CATEGORIAS) as [ProductCategory, { label: string; emoji: string }][]

export default function AdminMenuPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProduct, setEditingProduct] = useState<Partial<Producto> | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [filterCat, setFilterCat] = useState<ProductCategory | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => { loadProductos() }, [])

  async function loadProductos() {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('categoria')
      .order('orden')
    setProductos(data || [])
    setLoading(false)
  }

  // Filtros
  const filtered = productos.filter(p => {
    const matchCat = filterCat === 'all' || p.categoria === filterCat
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
  })

  async function handleSave(producto: Partial<Producto>) {
    try {
      if (producto.id) {
        // Update
        const { error } = await supabase
          .from('productos')
          .update({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            categoria: producto.categoria,
            disponible: producto.disponible,
            destacado: producto.destacado,
            alergenos: producto.alergenos,
            orden: producto.orden,
            imagen_url: producto.imagen_url,
          })
          .eq('id', producto.id)
        if (error) throw error
        toast.success('Producto actualizado ✓')
      } else {
        // Insert
        const { error } = await supabase
          .from('productos')
          .insert({
            nombre: producto.nombre!,
            descripcion: producto.descripcion,
            precio: producto.precio!,
            categoria: producto.categoria!,
            disponible: producto.disponible ?? true,
            destacado: producto.destacado ?? false,
            alergenos: producto.alergenos || [],
            orden: producto.orden || 0,
            imagen_url: producto.imagen_url,
          })
        if (error) throw error
        toast.success('Producto creado ✓')
      }
      setEditingProduct(null)
      setIsCreating(false)
      loadProductos()
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    }
  }

  async function toggleDisponible(p: Producto) {
    await supabase.from('productos').update({ disponible: !p.disponible }).eq('id', p.id)
    toast(p.disponible ? '⛔ Producto desactivado' : '✅ Producto activado')
    loadProductos()
  }

  async function toggleDestacado(p: Producto) {
    await supabase.from('productos').update({ destacado: !p.destacado }).eq('id', p.id)
    toast(p.destacado ? '⭐ Quitado de destacados' : '⭐ Añadido a destacados')
    loadProductos()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (!error) {
      toast.success('Producto eliminado')
      loadProductos()
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-3xl text-legado-cream font-bold">Gestión del Menú</h1>
          <p className="text-legado-cream-muted text-sm mt-1">{productos.length} productos en total</p>
        </div>
        <button
          onClick={() => { setEditingProduct({ disponible: true, destacado: false, alergenos: [], precio: 8.00, categoria: 'almuerzos', orden: 0 }); setIsCreating(true) }}
          className="btn-primary"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-legado-cream-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar producto..."
            className="input-legado pl-9"
          />
        </div>
        
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterCat('all')}
            className={`btn-ghost text-sm px-3 py-2 rounded-lg ${filterCat === 'all' ? 'text-legado-orange' : ''}`}
          >
            Todos
          </button>
          {CATEGORIAS_ARRAY.map(([cat, info]) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`text-sm px-3 py-2 rounded-lg transition-all ${
                filterCat === cat ? 'text-white' : 'text-legado-cream-muted'
              }`}
              style={filterCat === cat ? {
                background: 'linear-gradient(135deg, #E8763A 0%, #C85E24 100%)'
              } : { background: 'rgba(255,255,255,0.05)' }}
            >
              {info.emoji} {info.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(producto => (
            <motion.div
              key={producto.id}
              layout
              className="card p-4"
            >
              <div className="flex items-start gap-3">
                {/* Mini image */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-legado-surface-2 flex items-center justify-center flex-shrink-0">
                  {producto.imagen_url ? (
                    <Image src={producto.imagen_url} alt={producto.nombre} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-2xl">{CATEGORIAS[producto.categoria]?.emoji}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-playfair text-legado-cream font-semibold text-sm leading-tight">{producto.nombre}</h3>
                    <span className="text-legado-orange font-bold text-sm whitespace-nowrap">{producto.precio.toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs badge badge-orange">{CATEGORIAS[producto.categoria]?.label}</span>
                    {!producto.disponible && <span className="text-xs text-red-400">⛔ Oculto</span>}
                    {producto.destacado && <span className="text-xs text-yellow-400">⭐</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: '#4A3D2C' }}>
                <button onClick={() => { setEditingProduct(producto); setIsCreating(false) }}
                        className="btn-ghost p-1.5 rounded-lg text-xs flex items-center gap-1 flex-1 justify-center"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <Edit3 size={13} /> Editar
                </button>
                <button onClick={() => toggleDisponible(producto)}
                        className="btn-ghost p-1.5 rounded-lg flex-1 justify-center"
                        title={producto.disponible ? 'Desactivar' : 'Activar'}>
                  {producto.disponible ? <Eye size={14} color="#10B981" /> : <EyeOff size={14} color="#EF4444" />}
                </button>
                <button onClick={() => toggleDestacado(producto)}
                        className="btn-ghost p-1.5 rounded-lg flex-1 justify-center">
                  {producto.destacado ? <Star size={14} color="#C9A84C" fill="#C9A84C" /> : <StarOff size={14} />}
                </button>
                <button onClick={() => handleDelete(producto.id)}
                        className="btn-ghost p-1.5 rounded-lg flex-1 justify-center hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      <AnimatePresence>
        {editingProduct && (
          <ProductEditModal
            producto={editingProduct}
            isCreating={isCreating}
            onSave={handleSave}
            onClose={() => { setEditingProduct(null); setIsCreating(false) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ---- Edit Modal ----
function ProductEditModal({
  producto, isCreating, onSave, onClose
}: {
  producto: Partial<Producto>
  isCreating: boolean
  onSave: (p: Partial<Producto>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Partial<Producto>>(producto)
  const [allergenInput, setAllergenInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  function addAllergen() {
    if (!allergenInput.trim()) return
    setForm(f => ({ ...f, alergenos: [...(f.alergenos || []), allergenInput.trim()] }))
    setAllergenInput('')
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('productos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName)

      setForm(f => ({ ...f, imagen_url: publicUrl }))
      toast.success('Imagen subida correctamente')
    } catch (error: any) {
      toast.error('Error al subir la imagen')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={onClose} className="fixed inset-0 z-50"
                  style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} />
      
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 overflow-y-auto rounded-2xl"
                  style={{ background: '#1A1208', border: '1px solid #4A3D2C' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-playfair text-2xl text-legado-cream font-bold">
              {isCreating ? 'Nuevo Producto' : 'Editar Producto'}
            </h2>
            <button onClick={onClose}><X size={20} color="#C9C0B0" /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-legado-cream-muted text-sm block mb-1">Nombre *</label>
              <input value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                     className="input-legado" placeholder="Nombre del producto" />
            </div>

            <div>
              <label className="text-legado-cream-muted text-sm block mb-1">Descripción</label>
              <textarea value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                        className="input-legado" rows={3} placeholder="Descripción del plato..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-legado-cream-muted text-sm block mb-1">Precio (€) *</label>
                <input type="number" step="0.01" min="0" value={form.precio || ''}
                       onChange={e => setForm(f => ({ ...f, precio: parseFloat(e.target.value) }))}
                       className="input-legado" />
              </div>
              <div>
                <label className="text-legado-cream-muted text-sm block mb-1">Categoría *</label>
                <select value={form.categoria || 'almuerzos'}
                        onChange={e => setForm(f => ({ ...f, categoria: e.target.value as ProductCategory }))}
                        className="input-legado">
                  {CATEGORIAS_ARRAY.map(([cat, info]) => (
                    <option key={cat} value={cat}>{info.emoji} {info.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Imagen Uploader */}
            <div>
              <label className="text-legado-cream-muted text-sm block mb-2">Imagen del Producto</label>
              <div className="flex items-center gap-4 bg-[#2A1F10]/50 p-3 rounded-xl border border-[#4A3D2C]">
                {form.imagen_url ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-legado-surface-2 border border-[#4A3D2C] flex-shrink-0">
                    <Image src={form.imagen_url} alt="Vista previa" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[#2A1F10] border border-[#4A3D2C] flex items-center justify-center flex-shrink-0">
                    <Upload size={20} className="text-legado-cream-muted" />
                  </div>
                )}
                
                <div className="flex-1">
                  <label className="btn-secondary cursor-pointer inline-flex items-center gap-2 text-sm py-2 px-3">
                    <Upload size={14} />
                    {uploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                  <p className="text-xs text-legado-cream-muted mt-1.5">
                    Se recomienda formato cuadrado (JPG/PNG).
                  </p>
                </div>
              </div>
            </div>

            {/* Alergenos */}
            <div>
              <label className="text-legado-cream-muted text-sm block mb-2">Alérgenos</label>
              <div className="flex gap-2 mb-2">
                <input value={allergenInput} onChange={e => setAllergenInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && addAllergen()}
                       className="input-legado flex-1" placeholder="Ej: Gluten, Huevo..." />
                <button onClick={addAllergen} className="btn-secondary px-3">+</button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.alergenos?.map(a => (
                  <span key={a} className="allergen-pill cursor-pointer"
                        onClick={() => setForm(f => ({ ...f, alergenos: f.alergenos?.filter(x => x !== a) }))}>
                    {a} ×
                  </span>
                ))}
              </div>
            </div>

            {/* Switches */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.disponible ?? true}
                       onChange={e => setForm(f => ({ ...f, disponible: e.target.checked }))}
                       className="w-4 h-4 accent-orange-500" />
                <span className="text-legado-cream text-sm">Disponible</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.destacado ?? false}
                       onChange={e => setForm(f => ({ ...f, destacado: e.target.checked }))}
                       className="w-4 h-4 accent-yellow-500" />
                <span className="text-legado-cream text-sm">⭐ Destacado</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={() => onSave(form)} className="btn-primary flex-1 justify-center">
              <Save size={16} /> Guardar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
