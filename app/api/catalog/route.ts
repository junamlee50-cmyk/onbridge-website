import {catalog,json} from '../../catalog-server';
export const dynamic='force-dynamic';
export async function GET(){try{return await catalog();}catch{return json({error:'상품 정보를 불러오지 못했습니다.'},503);}}
