import { env } from 'cloudflare:workers';
export const defaults=[{id:'character',name:'캐릭터 굿즈',sort_order:0},{id:'stationery',name:'문구',sort_order:1},{id:'lifestyle',name:'생활용품',sort_order:2},{id:'food',name:'식음료',sort_order:3}];
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}});}
export function isOwner(request:Request){const expected=(env as any).ADMIN_EMAIL;const email=request.headers.get('oai-authenticated-user-email');const id=request.headers.get('oai-authenticated-user-id');return !!expected&&!!id&&!!email&&email.toLowerCase()===expected.toLowerCase();}
export function guard(request:Request){if(!isOwner(request))throw Object.assign(new Error('관리자 로그인이 필요합니다.'),{status:403});if(!['GET','HEAD'].includes(request.method)){const origin=request.headers.get('origin');if(origin!==new URL(request.url).origin)throw Object.assign(new Error('요청 출처가 올바르지 않습니다.'),{status:403});}}
function db(){if(!env.DB)throw new Error('상품 데이터 저장소가 연결되지 않았습니다.');return env.DB;}
export async function catalog(){const d=db();const [cat,prod,total]=await Promise.all([d.prepare('SELECT * FROM categories ORDER BY sort_order,name').all(),d.prepare("SELECT * FROM products WHERE status='published' ORDER BY created_at DESC").all(),d.prepare("SELECT COUNT(*) AS n FROM products").first()]);return json({hasProducts:Number((total as any)?.n||0)>0,categories:cat.results.length?cat.results:defaults,products:prod.results.map((p:any)=>({...p,image:p.image_key?'/api/images/'+p.image_key:null,images:photoKeys(p).map((k:string)=>'/api/images/'+k)}))});}
function photoKeys(p:any):string[]{try{const all=JSON.parse(p.image_keys||'[]');return Array.isArray(all)&&all.length?all:(p.image_key?[p.image_key]:[]);}catch{return p.image_key?[p.image_key]:[];}}
function str(v:any,max:number,required=false){if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim()))throw Object.assign(new Error('입력 항목의 내용과 길이를 확인해 주세요.'),{status:400});return v.trim();}
export async function admin(request:Request,action:string[]){try{guard(request);const d=db();const path=action.join('/');
 if(request.method==='GET'&&path==='data'){const [c,p]=await Promise.all([d.prepare('SELECT * FROM categories ORDER BY sort_order,name').all(),d.prepare('SELECT * FROM products ORDER BY created_at DESC').all()]);return json({categories:c.results.length?c.results:defaults,products:p.results});}
 if(request.method==='POST'&&path==='bootstrap'){await d.batch(defaults.map(c=>d.prepare('INSERT OR IGNORE INTO categories (id,name,sort_order) VALUES (?,?,?)').bind(c.id,c.name,c.sort_order)));return json({ok:true});}
 if(request.method==='POST'&&path==='image'){
  if(Number(request.headers.get('content-length')||0)>5*1024*1024+65536)return json({error:'사진은 5MB 이하로 올려 주세요.'},413);
  const form=await request.formData();const file=form.get('image');if(!(file instanceof File)||file.size>5*1024*1024||file.size===0)return json({error:'5MB 이하의 사진을 선택해 주세요.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());let mime='';if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)mime='image/jpeg';else if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))mime='image/png';else if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')mime='image/webp';if(!mime)return json({error:'JPG·PNG·WebP 사진만 사용할 수 있습니다.'},400);
  if(!env.BUCKET)throw new Error('사진 저장소가 연결되지 않았습니다.');const key=crypto.randomUUID();await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});return json({key,url:'/api/images/'+key});
 }
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'JSON 요청이 필요합니다.'},415);
 if(Number(request.headers.get('content-length')||0)>20000)return json({error:'내용이 너무 깁니다.'},413);
 const body:any=await request.json();
 if(request.method==='POST'&&path==='category'){const id=body.id?str(body.id,80,true):crypto.randomUUID();const name=str(body.name,40,true);const order=Number.isInteger(body.sort_order)?body.sort_order:0;await d.prepare('INSERT INTO categories (id,name,sort_order) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,sort_order=excluded.sort_order').bind(id,name,order).run();return json({ok:true,id});}
 if(request.method==='POST'&&path==='product'){
  const name=str(body.name,100,true),category=str(body.category_id,80,true),description=str(body.description??'',3000),spec=str(body.spec??'',500),packing=str(body.packing??'',500),price=str(body.price??'공급 조건 문의',100);
  if(!['draft','published','archived'].includes(body.status))return json({error:'공개 상태를 확인해 주세요.'},400);
  const cat=await d.prepare('SELECT id FROM categories WHERE id=?').bind(category).first();if(!cat)return json({error:'카테고리를 먼저 등록해 주세요.'},400);
  const keys=body.image_keys??(body.image_key?[body.image_key]:[]);if(!Array.isArray(keys)||keys.some(k=>typeof k!=='string'||!/^[0-9a-f-]{36}$/.test(k)))return json({error:'사진을 다시 등록해 주세요.'},400);
  const unique=[...new Set(keys)];for(const key of unique){if(!env.BUCKET||!await env.BUCKET.head(key))return json({error:'사진을 다시 등록해 주세요.'},400);}const key=unique[0]||null;
  const id=body.id?str(body.id,80,true):crypto.randomUUID();const now=new Date().toISOString();
  await d.prepare('INSERT INTO products (id,category_id,name,description,spec,packing,price,image_key,image_keys,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,name=excluded.name,description=excluded.description,spec=excluded.spec,packing=excluded.packing,price=excluded.price,image_key=excluded.image_key,image_keys=excluded.image_keys,status=excluded.status,updated_at=excluded.updated_at').bind(id,category,name,description,spec,packing,price,key,JSON.stringify(unique),body.status,now,now).run();return json({ok:true,id});
 }
 return json({error:'지원하지 않는 요청입니다.'},404);
 }catch(e:any){console.error('Catalog request failed',e.message);return json({error:e.status?e.message:'처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'},e.status||500);}}
export async function image(request:Request,key:string){if(!/^[0-9a-f-]{36}$/.test(key))return new Response('Not found',{status:404});const published=await db().prepare("SELECT id FROM products WHERE (image_key=? OR EXISTS (SELECT 1 FROM json_each(products.image_keys) WHERE value=?)) AND status='published' LIMIT 1").bind(key,key).first();if(!published&&!isOwner(request))return new Response('Not found',{status:404});const object=await env.BUCKET?.get(key);if(!object)return new Response('Not found',{status:404});return new Response(object.body,{headers:{'content-type':object.httpMetadata?.contentType||'application/octet-stream','x-content-type-options':'nosniff','cache-control':'private,max-age=300'}});}
