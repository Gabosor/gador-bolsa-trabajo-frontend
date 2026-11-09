/** Tipo de un documento a partir de su URL (firmada o no), por la extensión. */
export function tipoDocumento(url?: string | null): 'pdf' | 'imagen' | 'otro' | null {
  if (!url) return null
  let ruta: string
  try {
    ruta = new URL(url).pathname.toLowerCase()
  } catch {
    return 'otro'
  }
  if (ruta.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp)$/.test(ruta)) return 'imagen'
  return 'otro'
}
