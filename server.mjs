import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createReadStream,existsSync} from 'node:fs';
import {extname,join,normalize,resolve} from 'node:path';
import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHmac} from 'node:crypto';

const root=resolve(process.cwd());
const dataFile=join(root,'data/products.json');
const runtimeDir=join(root,'data/runtime');
const runtimeFile=join(runtimeDir,'products.json');
const uploadsDir=join(root,'uploads');
const port=Number(process.env.PORT||4173);
const adminEmail=(process.env.CAPPETO_ADMIN_EMAIL||'').toLowerCase();
const adminPassword=process.env.CAPPETO_ADMIN_PASSWORD||'';
const sessionSecret=process.env.CAPPETO_SESSION_SECRET||randomBytes(32).toString('hex');
const isProduction=process.env.NODE_ENV==='production';
if(isProduction&&(!adminEmail||!adminPassword||!process.env.CAPPETO_SESSION_SECRET))throw new Error('Production requires CAPPETO_ADMIN_EMAIL, CAPPETO_ADMIN_PASSWORD, and CAPPETO_SESSION_SECRET');
if(!adminEmail||!adminPassword)console.warn('Staff sign-in is disabled until CAPPETO_ADMIN_EMAIL and CAPPETO_ADMIN_PASSWORD are configured.');

await mkdir(runtimeDir,{recursive:true});await mkdir(uploadsDir,{recursive:true});
if(!existsSync(runtimeFile))await writeFile(runtimeFile,await readFile(dataFile));
const sessions=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.json':'application/json; charset=utf-8'};
const securityHeaders={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"};
const json=(res,status,body,extra={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...securityHeaders,...extra});res.end(JSON.stringify(body))};
const readBody=async req=>{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>4_000_000)throw Object.assign(new Error('Request is too large'),{status:413});chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')};
const catalog=()=>readFile(runtimeFile,'utf8').then(JSON.parse);
async function saveCatalog(value){const temp=`${runtimeFile}.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(value,null,2));await rename(temp,runtimeFile)}
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim().split('=').map(decodeURIComponent)).filter(pair=>pair.length===2));
const sign=value=>createHmac('sha256',sessionSecret).update(value).digest('base64url');
function sessionFor(req){const raw=cookies(req).cappeto_session;if(!raw)return null;const [id,signature]=raw.split('.');if(!id||!signature)return null;const expected=Buffer.from(sign(id));const actual=Buffer.from(signature);if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return null;const session=sessions.get(id);if(!session||session.expiresAt<Date.now()){sessions.delete(id);return null}return session}
function requireStaff(req,res){const session=sessionFor(req);if(!session){json(res,401,{error:'Please sign in again.'});return null}if(!['POST','PUT','PATCH','DELETE'].includes(req.method))return session;if(req.headers['x-csrf-token']!==session.csrf){json(res,403,{error:'Security token is missing or expired.'});return null}return session}
const clean=(value,max)=>String(value||'').trim().replace(/[<>]/g,'').slice(0,max);
const validItems=(items,products)=>{if(!Array.isArray(items)||items.length>20)throw Object.assign(new Error('Order items are invalid.'),{status:400});return items.map(item=>{const product=products.find(p=>p.id===item.productId);const quantity=Number(item.quantity);if(!product||!Number.isInteger(quantity)||quantity<1||quantity>product.stock)throw Object.assign(new Error('A product or quantity is no longer available.'),{status:409});return{product,quantity}})};
const totals=(lines,defaultVatRate)=>{const subtotalCents=lines.reduce((sum,line)=>sum+line.product.priceCents*line.quantity,0);const vatCents=lines.reduce((sum,line)=>sum+Math.round(line.product.priceCents*line.quantity*Number(line.product.vatRate??defaultVatRate)/100),0);return{subtotalCents,vatCents,totalCents:subtotalCents+vatCents,vatRate:defaultVatRate}};
function applyInventoryChange(product,action,quantity){if(!['add','return','damage','sold'].includes(action)||!Number.isInteger(quantity)||quantity<1||quantity>9999)throw Object.assign(new Error('Inventory adjustment is invalid.'),{status:400});product.returned=Number(product.returned||0);product.damaged=Number(product.damaged||0);product.sold=Number(product.sold||0);if(action==='add'||action==='return')product.stock+=quantity;if(action==='return')product.returned+=quantity;if(action==='damage'||action==='sold'){if(quantity>product.stock)throw Object.assign(new Error('Quantity exceeds available inventory.'),{status:409});product.stock-=quantity;product[action==='damage'?'damaged':'sold']+=quantity}}

const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://local');
  if(url.pathname==='/api/auth/login'&&req.method==='POST'){
    if(!adminEmail||!adminPassword)return json(res,503,{error:'Staff sign-in is not configured yet.'});
    const body=await readBody(req);
    const email=clean(body.email,160).toLowerCase();const password=String(body.password||'');
    const expected=scryptSync(adminPassword,'cappeto-login-v1',64);const received=scryptSync(password,'cappeto-login-v1',64);
    if(email!==adminEmail||!timingSafeEqual(expected,received))return json(res,401,{error:'Email or password is incorrect.'});
    const id=randomBytes(24).toString('base64url');const csrf=randomBytes(24).toString('base64url');sessions.set(id,{email,csrf,expiresAt:Date.now()+8*60*60*1000});
    return json(res,200,{user:{email,role:'owner'},csrfToken:csrf},{'Set-Cookie':`cappeto_session=${id}.${sign(id)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${isProduction?'; Secure':''}`});
  }
  if(url.pathname==='/api/auth/session'&&req.method==='GET'){const session=sessionFor(req);return json(res,200,session?{authenticated:true,user:{email:session.email,role:'owner'},csrfToken:session.csrf}:{authenticated:false})}
  if(url.pathname==='/api/auth/logout'&&req.method==='POST'){const session=requireStaff(req,res);if(!session)return;const raw=cookies(req).cappeto_session;sessions.delete(raw?.split('.')[0]);return json(res,200,{ok:true},{'Set-Cookie':'cappeto_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})}
  if(url.pathname==='/api/products'&&req.method==='GET'){const data=await catalog();return json(res,200,data)}
  if(url.pathname==='/api/products'&&req.method==='POST'){
    if(!requireStaff(req,res))return;const body=await readBody(req);const data=await catalog();if(data.products.length>=20)return json(res,409,{error:'The 20-product limit has been reached.'});
    const name=clean(body.name,80),category=clean(body.category,40),description=clean(body.description,140),priceCents=Math.round(Number(body.price)*100),vatRate=Number(body.vatRate),stock=Number(body.stock),purchaseDate=clean(body.purchaseDate,10);
    if(!name||!category||!description||!Number.isInteger(priceCents)||priceCents<1||priceCents>999900||!Number.isFinite(vatRate)||vatRate<0||vatRate>100||!Number.isInteger(stock)||stock<0||stock>9999||!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate))return json(res,400,{error:'Check the product details and try again.'});
    const match=String(body.imageData||'').match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/);if(!match)return json(res,400,{error:'The uploaded picture must be a valid WebP image.'});const image=Buffer.from(match[1],'base64');if(image.length>2_500_000||image.subarray(0,4).toString()!=='RIFF'||image.subarray(8,12).toString()!=='WEBP')return json(res,400,{error:'The WebP image is invalid or larger than 2.5 MB.'});
    const id=`${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'product'}-${randomBytes(3).toString('hex')}`;await writeFile(join(uploadsDir,`${id}.webp`),image,{flag:'wx'});const product={id,name,category,description,priceCents,vatRate,stock,purchaseDate,returned:0,damaged:0,sold:0,imageUrl:`/uploads/${id}.webp`};data.products.push(product);await saveCatalog(data);return json(res,201,{product})
  }
  if(url.pathname.startsWith('/api/products/')&&req.method==='PUT'){
    if(!requireStaff(req,res))return;const id=decodeURIComponent(url.pathname.slice(14));const body=await readBody(req);const data=await catalog();const product=data.products.find(item=>item.id===id);if(!product)return json(res,404,{error:'Product not found.'});
    const name=clean(body.name,80),category=clean(body.category,40),description=clean(body.description,140),priceCents=Math.round(Number(body.price)*100),vatRate=Number(body.vatRate),stock=Number(body.stock),purchaseDate=clean(body.purchaseDate,10);
    if(!name||!category||!description||!Number.isInteger(priceCents)||priceCents<1||priceCents>999900||!Number.isFinite(vatRate)||vatRate<0||vatRate>100||!Number.isInteger(stock)||stock<0||stock>9999||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(purchaseDate))return json(res,400,{error:'Check the product details and try again.'});
    let imageUrl=product.imageUrl;if(String(body.imageData||'').startsWith('data:')){const match=String(body.imageData).match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/);if(!match)return json(res,400,{error:'The uploaded picture must be a valid WebP image.'});const image=Buffer.from(match[1],'base64');if(image.length>2_500_000||image.subarray(0,4).toString()!=='RIFF'||image.subarray(8,12).toString()!=='WEBP')return json(res,400,{error:'The WebP image is invalid or larger than 2.5 MB.'});await writeFile(join(uploadsDir,`${id}.webp`),image);imageUrl=`/uploads/${id}.webp`}
    Object.assign(product,{name,category,description,priceCents,vatRate,stock,purchaseDate,imageUrl});await saveCatalog(data);return json(res,200,{product})
  }
  if(url.pathname.startsWith('/api/products/')&&url.pathname.endsWith('/inventory')&&req.method==='PATCH'){if(!requireStaff(req,res))return;const id=decodeURIComponent(url.pathname.slice(14,-10));const body=await readBody(req);const data=await catalog();const product=data.products.find(item=>item.id===id);if(!product)return json(res,404,{error:'Product not found.'});const vatRate=Number(body.vatRate),purchaseDate=clean(body.purchaseDate,10);if(!Number.isFinite(vatRate)||vatRate<0||vatRate>100||(purchaseDate&&!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)))return json(res,400,{error:'VAT or purchase date is invalid.'});applyInventoryChange(product,body.action,Number(body.quantity));product.vatRate=vatRate;if(purchaseDate)product.purchaseDate=purchaseDate;await saveCatalog(data);return json(res,200,{product})}
  if(url.pathname.startsWith('/api/products/')&&req.method==='DELETE'){if(!requireStaff(req,res))return;const id=decodeURIComponent(url.pathname.slice(14));const data=await catalog();const before=data.products.length;data.products=data.products.filter(p=>p.id!==id);if(data.products.length===before)return json(res,404,{error:'Product not found.'});await saveCatalog(data);return json(res,200,{ok:true})}
  if(url.pathname==='/api/orders/quote'&&req.method==='POST'){const body=await readBody(req);const data=await catalog();return json(res,200,totals(validItems(body.items,data.products),data.vatRate))}
  if(url.pathname==='/api/orders'&&req.method==='POST'){const body=await readBody(req);const data=await catalog();const lines=validItems(body.items,data.products);const amount=totals(lines,data.vatRate);for(const line of lines)applyInventoryChange(line.product,'sold',line.quantity);await saveCatalog(data);return json(res,201,{orderId:randomUUID().slice(0,8).toUpperCase(),...amount})}
  if(url.pathname.startsWith('/api/'))return json(res,404,{error:'Not found'});
  let pathname=url.pathname==='/'?'/index.html':url.pathname;pathname=normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const publicTopLevel=new Set(['/index.html','/styles.css','/app.js']);
  if(!publicTopLevel.has(pathname)&&!pathname.startsWith('/uploads/')&&!pathname.startsWith('/assets/products/')&&!pathname.startsWith('/i18n/'))return json(res,404,{error:'Not found'});
  const file=join(root,pathname);if(!file.startsWith(root)||!existsSync(file))return json(res,404,{error:'Not found'});const extension=extname(file);const cacheControl=['.html','.js','.css'].includes(extension)?'no-store':'public, max-age=3600';res.writeHead(200,{'Content-Type':mime[extension]||'application/octet-stream','Cache-Control':cacheControl,...securityHeaders});createReadStream(file).pipe(res)
}catch(error){console.error(error);json(res,error.status||500,{error:error.status?error.message:'The server could not complete this request.'})}});
server.listen(port,'0.0.0.0',()=>console.log(`Cappeto ready on http://localhost:${port}`));
