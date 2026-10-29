import {image} from '../../../catalog-server';
export const dynamic='force-dynamic';
export async function GET(req:Request,ctx:any){return image(req,(await ctx.params).key);}
