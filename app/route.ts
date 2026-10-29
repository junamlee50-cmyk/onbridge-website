import { homepage } from './content';
import { isOwner } from './catalog-server';
export const dynamic='force-dynamic';
export function GET(request:Request){const content=isOwner(request)?homepage.replace('<div class="collection-toolbar">','<div class="collection-admin"><a class="button" href="/admin">사진·상품 등록 및 상품군 관리 ↗</a></div><div class="collection-toolbar">'):homepage;return new Response(content,{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store'}});}
