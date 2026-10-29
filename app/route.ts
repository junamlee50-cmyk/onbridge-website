import { homepage } from './content';
export function GET(){return new Response(homepage,{headers:{'content-type':'text/html;charset=utf-8'}});}
