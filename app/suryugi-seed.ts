import products from './suryugi-data.json';

// Approved one-time catalog import. Existing edits and visibility always win.
let pending: Promise<void> | undefined;
export function ensureSuryugiCatalog(env: any, categories: any[]) {
  if (!pending) pending = importCatalog(env, categories).catch(error => {pending = undefined; throw error;});
  return pending;
}
async function importCatalog(env: any, categories: any[]) {
  for (const c of categories) await env.DB.prepare('INSERT OR IGNORE INTO categories (id,name,parent_id,sort_order) VALUES (?,?,?,?)').bind(c.id,c.name,c.parent_id||null,c.sort_order).run();
  for (let i=0; i<products.length; i++) {
    const p = products[i];
    if (await env.DB.prepare('SELECT id FROM products WHERE id=?').bind(p.id).first()) continue;
    for (const photo of p.images) {
      const bytes = Uint8Array.from(atob(photo.data), c => c.charCodeAt(0));
      await env.BUCKET.put(photo.key, bytes, {httpMetadata:{contentType:'image/webp'}});
    }
    const keys = p.images.map(photo=>photo.key);
    const date = new Date(Date.UTC(2026,9,29,7,40,8-i)).toISOString();
    await env.DB.prepare('INSERT OR IGNORE INTO products (id,category_id,name,description,spec,packing,price,image_key,image_keys,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(p.id,p.category_id,p.name,p.description,p.spec,p.packing,p.price,keys[0],JSON.stringify(keys),'published',date,date).run();
  }
}
