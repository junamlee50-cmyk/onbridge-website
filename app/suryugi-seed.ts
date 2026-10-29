import suryugiProducts from './suryugi-data.json';
import examples from './catalog-examples.json';
import uploadedProducts from './uploaded-products.json';
import foodPhotos from './food-photos.json';

const foodDescription = (description: string, photo: typeof foodPhotos[number]) => description.replace('이미지는 상품군을 표현한 예시 일러스트입니다.', '사진은 상품군 소개를 위한 실제 촬영 참고 이미지입니다. 실제 공급 제품은 상담 후 확정합니다.') + '\n\n사진: ' + photo.credit + '\n사진 원문: ' + photo.source + '\n이용허락: ' + photo.license + '\n표시용 크기 조정 및 WebP 변환';
const products = [...suryugiProducts, ...examples.map(p => {
  const photo = foodPhotos.find(f => f.id === p.id);
  return photo ? {...p, images:photo.images, description:foodDescription(p.description, photo)} : p;
}), ...uploadedProducts];

// Import missing entries only; preserve owner edits and visibility thereafter.
let pending: Promise<void> | undefined;
export function ensureSuryugiCatalog(env: any, categories: any[]) {
  if (!pending) pending = importCatalog(env, categories).catch(error => {pending = undefined; throw error;});
  return pending;
}
async function importCatalog(env: any, categories: any[]) {
  const existing = (await env.DB.prepare('SELECT id,image_key,description FROM products').all()).results;
  const byId = new Map<string, any>(existing.map((p:any) => [p.id,p]));
  const missing = products.filter(p => !byId.has(p.id));
  const replaceFood = foodPhotos.filter(photo => {
    const current = byId.get(photo.id), old = examples.find(p=>p.id===photo.id);
    return current && current.image_key === old?.images[0].key;
  });
  if (!missing.length && !replaceFood.length) return;
  const images = [...missing.flatMap(p=>p.images), ...replaceFood.flatMap(p=>p.images)];
  // Bound concurrent object writes and batch SQL to keep first catalog load short.
  for (let start=0; start<images.length; start+=4) {
    await Promise.all(images.slice(start,start+4).map(photo=>env.BUCKET.put(photo.key,Uint8Array.from(atob(photo.data),c=>c.charCodeAt(0)),{httpMetadata:{contentType:'image/webp'}})));
  }
  const statements = categories.map(c=>env.DB.prepare('INSERT OR IGNORE INTO categories (id,name,parent_id,sort_order) VALUES (?,?,?,?)').bind(c.id,c.name,c.parent_id||null,c.sort_order));
  for (const p of missing) {
    const keys=p.images.map(photo=>photo.key);
    const order=products.findIndex(x=>x.id===p.id);
    const date=new Date(Date.UTC(2026,9,29,7,40,8-order)).toISOString();
    statements.push(env.DB.prepare('INSERT OR IGNORE INTO products (id,category_id,name,description,spec,packing,price,image_key,image_keys,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(p.id,p.category_id,p.name,p.description,p.spec,p.packing,p.price,keys[0],JSON.stringify(keys),'published',date,date));
  }
  for(const photo of replaceFood) {
    const current=byId.get(photo.id), old=examples.find(p=>p.id===photo.id)!;
    statements.push(env.DB.prepare('UPDATE products SET image_key=?,image_keys=?,description=? WHERE id=? AND image_key=?').bind(photo.images[0].key,JSON.stringify(photo.images.map(p=>p.key)),foodDescription(current.description,photo),photo.id,old.images[0].key));
  }
  // User supplied real product photos replace the temporary reference illustrations.
  if (missing.some(p=>p.id.startsWith('uploaded-'))) {
    for (const p of examples.filter(p=>p.id.startsWith('reference-'))) statements.push(env.DB.prepare("UPDATE products SET status='archived' WHERE id=?").bind(p.id));
  }
  if(statements.length) await env.DB.batch(statements);
}
