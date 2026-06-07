import jsPDF from 'jspdf'
import type { Pedido, Mesa } from '@/types'

export function generateInvoicePDF({
  facturaNumero,
  mesa,
  cliente,
  items,
  total,
  subtotal,
  iva
}: {
  facturaNumero: string
  mesa: { numero: number; zona?: string } | null
  cliente: { nombre: string; telefono?: string } | null
  items: Array<{ cantidad: number; producto: { nombre: string; precio: number } }>
  total: number
  subtotal: number
  iva: number
}) {
  const doc = new jsPDF()
  
  // Configuración básica (Simulando Logo)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(232, 118, 58) // Naranja
  doc.text('LEGADO', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text('GASTROBAR', 105, 25, { align: 'center' })
  
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('RESUMEN DE PEDIDO', 105, 35, { align: 'center' })
  
  // Datos Factura
  let currentY = 45
  doc.setFontSize(10)
  doc.text(`Factura Nº: ${facturaNumero || '---'}`, 20, currentY)
  currentY += 6
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 20, currentY)
  currentY += 6
  doc.text(`Mesa: ${mesa?.numero ? `Mesa ${mesa.numero}` : 'Barra'}`, 20, currentY)
  currentY += 6
  if (cliente?.nombre) {
    doc.text(`Cliente: ${cliente.nombre}`, 20, currentY)
    currentY += 6
  }
  if (cliente?.telefono) {
    doc.text(`Teléfono: ${cliente.telefono}`, 20, currentY)
    currentY += 6
  }

  // Línea separadora
  doc.setLineWidth(0.5)
  currentY += 4
  doc.line(20, currentY, 190, currentY)
  
  // Productos
  currentY += 10
  doc.setFont('helvetica', 'bold')
  doc.text('Cant.', 20, currentY)
  doc.text('Producto', 40, currentY)
  doc.text('Precio', 170, currentY)
  
  doc.setFont('helvetica', 'normal')
  currentY += 8
  
  items.forEach(item => {
    doc.text(`${item.cantidad}`, 20, currentY)
    doc.text(`${item.producto.nombre}`, 40, currentY)
    doc.text(`${(item.producto.precio * item.cantidad).toFixed(2)} €`, 170, currentY)
    currentY += 6
  })
  
  // Línea separadora
  currentY += 4
  doc.line(20, currentY, 190, currentY)
  currentY += 8
  
  // Totales
  doc.text(`Subtotal:`, 140, currentY)
  doc.text(`${subtotal.toFixed(2)} €`, 170, currentY)
  currentY += 6
  
  doc.text(`IVA (10%):`, 140, currentY)
  doc.text(`${iva.toFixed(2)} €`, 170, currentY)
  currentY += 6
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`TOTAL:`, 140, currentY)
  doc.text(`${total.toFixed(2)} €`, 170, currentY)
  
  // Guardar
  doc.save(`Factura_${facturaNumero || 'Legado'}.pdf`)
}
