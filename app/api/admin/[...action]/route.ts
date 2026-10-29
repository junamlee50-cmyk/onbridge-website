import {admin} from '../../../catalog-server';
export const dynamic='force-dynamic';
export async function GET(req:Request,ctx:any){return admin(req,(await ctx.params).action||[]);}
export async function POST(req:Request,ctx:any){return admin(req,(await ctx.params).action||[]);}
