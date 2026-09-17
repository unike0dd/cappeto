const $=id=>document.getElementById(id);
const preferences={
  language:localStorage.getItem('cappeto_language')==='es'?'es':'en',
  theme:localStorage.getItem('cappeto_theme')==='dark'?'dark':'light'
};
const translations=window.CAPPETO_I18N;
const t=(key,values={})=>{let text=translations[preferences.language].ui[key]??translations.en.ui[key]??key;for(const [name,value] of Object.entries(values))text=text.replaceAll(`{${name}}`,String(value));return text};
const productCopy=product=>preferences.language==='es'&&translations.products[product.id]?{name:translations.products[product.id][0],category:translations.products[product.id][1],description:translations.products[product.id][2]}:{name:product.name,category:product.category,description:product.description};
const errorKeys={'Please sign in again.':'signInAgain','The 20-product limit has been reached.':'limitReached','Product not found.':'productNotFound','This action is unavailable.':'actionUnavailable','Unexpected server response':'unexpectedResponse','Request failed':'requestFailed','Enter a valid whole quantity.':'wholeQuantity','Quantity exceeds available inventory.':'quantityExceeded','Email or password is incorrect.':'invalidCredentials'};
const localizeError=error=>preferences.language==='es'&&translations.errors[error.message]?translations.errors[error.message]:t(errorKeys[error.message]||error.message);
function applyPreferences(){
  document.documentElement.lang=preferences.language;
  document.documentElement.dataset.theme=preferences.theme;
  document.querySelectorAll('[data-language-toggle]').forEach(button=>{button.textContent=preferences.language==='en'?'EN':'ES';button.setAttribute('aria-label',t('languageLabel'));button.setAttribute('aria-pressed',String(preferences.language==='es'))});
  document.querySelectorAll('[data-theme-toggle]').forEach(button=>{button.textContent=preferences.theme==='light'?'Light':'Dark';button.setAttribute('aria-label',preferences.theme==='dark'?t('themeLight'):t('themeDark'));button.setAttribute('aria-pressed',String(preferences.theme==='light'))});
  document.querySelectorAll('[data-i18n]').forEach(element=>element.textContent=t(element.dataset.i18n));
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element=>element.placeholder=t(element.dataset.i18nPlaceholder));
  document.querySelectorAll('[data-i18n-aria]').forEach(element=>element.setAttribute('aria-label',t(element.dataset.i18nAria)));
  if($('passwordToggle'))$('passwordToggle').textContent=t($('authCode').type==='text'?'hidePassword':'showPassword');
  $('skipLink').textContent=preferences.language==='es'?'Ir al contenido principal':'Skip to main content';
  const spanish=preferences.language==='es';
  document.title=spanish?'Cappeto · Menú de café':'Cappeto · Café menu';
  document.querySelector('meta[name="description"]').content=spanish?'Explore el menú de Cappeto, revise la disponibilidad y prepare un pedido con subtotal, IVA y total claros.':"Browse Cappeto's café menu, review product availability, and prepare an order with clear subtotal, VAT, and total pricing.";
  document.querySelector('meta[name="theme-color"]').content=preferences.theme==='dark'?'#0d1511':'#f4f6f0';
  const authValue=document.querySelector('.auth-value');
  if(authValue){
    const shopImage=preferences.language==='es'?'assets/branding/cafteria_logo_ES.png':'assets/branding/cafteria_logo_EN.png';
    authValue.style.setProperty('--auth-shop-image',`url("${shopImage}")`);
  }
  if($('authForm')?.dataset.mode)setAuthMode($('authForm').dataset.mode);
}
applyPreferences();
document.querySelectorAll('[data-language-toggle]').forEach(button=>button.addEventListener('click',()=>{preferences.language=preferences.language==='en'?'es':'en';localStorage.setItem('cappeto_language',preferences.language);applyPreferences();if(!$('appView').classList.contains('hidden')){renderAll();renderProductPreview();showStaffControls(Boolean(state.staff))}}));
document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{preferences.theme=preferences.theme==='dark'?'light':'dark';localStorage.setItem('cappeto_theme',preferences.theme);applyPreferences()}));
const state={products:[],cart:new Map(),category:'All',query:'',manageQuery:'',financeView:'inventory',staff:null,csrf:'',imageData:'',editingProductId:null,carouselIndex:0,quoteVersion:0};
const defaultBusinessProfile={name:'Cappeto',logo:'',address:'',phone:'',email:'',currency:'USD'};
let businessProfile=loadBusinessProfile();
let pendingBusinessLogo=businessProfile.logo;
const money=cents=>new Intl.NumberFormat(preferences.language==='es'?'es-EC':'en-US',{style:'currency',currency:'USD'}).format(cents/100);
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const searchSynonyms=[
  ['coffee','cafe','café'],
  ['juice','jugo','zumo'],
  ['soda','gaseosa','refresco'],
  ['bread','pan'],
  ['milk','leche'],
  ['chicken','pollo'],
  ['turkey','pavo'],
  ['strawberry','fresa','frutilla'],
  ['watermelon','sandia','sandía'],
  ['orange','naranja'],
  ['cinnamon','canela'],
  ['cheese','queso'],
  ['burger','hamburger','hamburguesa'],
  ['wrap','tortilla','envuelto'],
  ['hotdog','salchicha'],
  ['soldout','agotado']
].map(group=>group.map(value=>value.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase()));
const normalizeSearch=value=>String(value??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const searchTokens=value=>normalizeSearch(value).split(/\\s+/).filter(Boolean);
function editDistanceWithin(left,right,limit){
  if(Math.abs(left.length-right.length)>limit)return false;
  let previous=Array.from({length:right.length+1},(_,index)=>index);
  for(let row=1;row<=left.length;row++){
    const current=[row];let rowMinimum=row;
    for(let column=1;column<=right.length;column++){
      current[column]=Math.min(current[column-1]+1,previous[column]+1,previous[column-1]+(left[row-1]===right[column-1]?0:1));
      rowMinimum=Math.min(rowMinimum,current[column]);
    }
    if(rowMinimum>limit)return false;
    previous=current;
  }
  return previous[right.length]<=limit;
}
function tokenMatches(queryToken,candidate){
  if(candidate.includes(queryToken)||queryToken.includes(candidate))return true;
  if(queryToken.length<4||candidate.length<4)return false;
  const limit=Math.max(queryToken.length,candidate.length)>=8?2:1;
  return editDistanceWithin(queryToken,candidate,limit);
}
function productSearchText(product){
  const spanish=translations.products[product.id]||[];
  return [product.id,product.name,product.category,product.description,...spanish].join(' ');
}
function productMatchesSearch(product,query){
  const requested=searchTokens(query);
  if(!requested.length)return true;
  const available=searchTokens(productSearchText(product));
  return requested.every(token=>{
    const synonymGroup=searchSynonyms.find(group=>group.includes(token));
    const alternatives=synonymGroup||[token];
    return alternatives.some(alternative=>available.some(candidate=>tokenMatches(alternative,candidate)));
  });
}
const staticPrototype=location.hostname.endsWith('github.io');
let staticCatalog=null;

async function digest(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
async function staticApi(path,options={}){
  const method=options.method||'GET';
  const body=JSON.parse(options.body||'{}');
  if(path==='/api/auth/session')return sessionStorage.getItem('cappeto_demo_session')?{authenticated:true,user:{email:'Cappeto owner',role:'owner'},csrfToken:'static-preview'}:{authenticated:false};
  if(path==='/api/auth/login'&&method==='POST'){
    const fingerprint=await digest(`${String(body.email||'').trim().toLowerCase()}:${String(body.password||'')}`);
    if(fingerprint!=='b6b030b845221156f2bd566f039e0d9d076c636f019b6e6f4e0a3fedd4b5d336')throw new Error('Email or password is incorrect.');
    sessionStorage.setItem('cappeto_demo_session','active');return{user:{email:'Cappeto owner',role:'owner'},csrfToken:'static-preview'};
  }
  if(path==='/api/auth/logout'){sessionStorage.removeItem('cappeto_demo_session');return{ok:true}}
  if(!staticCatalog)staticCatalog=await fetch('data/products.json',{cache:'no-store'}).then(response=>response.json());
  if(path==='/api/products'&&method==='GET'){
    if(sessionStorage.getItem('cappeto_demo_session'))return staticCatalog;
    return{...staticCatalog,products:staticCatalog.products.map(({procurementCostCents,returned,damaged,sold,purchaseDate,...product})=>product)};
  }
  if(path==='/api/inventory/reset'&&method==='POST'){
    if(!sessionStorage.getItem('cappeto_demo_session'))throw new Error('Please sign in again.');
    const resetCount=staticCatalog.products.filter(product=>Number(product.stock)>0).length;
    staticCatalog.products.forEach(product=>{product.stock=0});
    return{ok:true,resetCount};
  }
  if(path==='/api/products'&&method==='POST'){
    if(!sessionStorage.getItem('cappeto_demo_session'))throw new Error('Please sign in again.');
    if(staticCatalog.products.length>=20)throw new Error('The 20-product limit has been reached.');
    const product={id:`demo-${Date.now()}`,name:body.name,category:body.category,description:body.description,priceCents:Math.round(Number(body.price)*100),procurementCostCents:Math.round(Number(body.procurementCost)*100),vatRate:Number(body.vatRate),stock:Number(body.stock),purchaseDate:body.purchaseDate,returned:0,damaged:0,sold:0,imageUrl:body.imageData};
    staticCatalog.products.push(product);return{product};
  }
  if(path.startsWith('/api/products/')&&method==='PUT'){
    if(!sessionStorage.getItem('cappeto_demo_session'))throw new Error('Please sign in again.');
    const id=decodeURIComponent(path.slice(14));const product=staticCatalog.products.find(entry=>entry.id===id);if(!product)throw new Error('Product not found.');
    Object.assign(product,{name:body.name,category:body.category,description:body.description,priceCents:Math.round(Number(body.price)*100),procurementCostCents:Math.round(Number(body.procurementCost)*100),vatRate:Number(body.vatRate),stock:Number(body.stock),purchaseDate:body.purchaseDate,imageUrl:body.imageData||product.imageUrl});return{product};
  }
  if(path.endsWith('/inventory')&&path.startsWith('/api/products/')&&method==='PATCH'){
    const id=decodeURIComponent(path.slice(14,-10));const product=staticCatalog.products.find(entry=>entry.id===id);if(!product)throw new Error('Product not found.');
    applyInventoryChange(product,body.action,Number(body.quantity));product.vatRate=Number(body.vatRate);if(body.purchaseDate)product.purchaseDate=body.purchaseDate;return{product};
  }
  if(path.startsWith('/api/products/')&&method==='DELETE'){staticCatalog.products=staticCatalog.products.filter(product=>product.id!==decodeURIComponent(path.slice(14)));return{ok:true}}
  if((path==='/api/orders/quote'||path==='/api/orders')&&method==='POST'){
    const lines=(body.items||[]).map(item=>({product:staticCatalog.products.find(entry=>entry.id===item.productId),quantity:item.quantity})).filter(line=>line.product);const subtotalCents=lines.reduce((sum,line)=>sum+line.product.priceCents*line.quantity,0);
    const vatCents=lines.reduce((sum,line)=>sum+Math.round(line.product.priceCents*line.quantity*Number(line.product.vatRate??staticCatalog.vatRate)/100),0);if(path==='/api/orders')lines.forEach(line=>applyInventoryChange(line.product,'sold',line.quantity));return{subtotalCents,vatCents,totalCents:subtotalCents+vatCents,vatRate:staticCatalog.vatRate,orderId:`DEMO-${Date.now().toString().slice(-6)}`};
  }
  throw new Error('This action is unavailable.');
}

async function api(path,options={}){
  if(staticPrototype)return staticApi(path,options);
  const response=await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(state.csrf?{'X-CSRF-Token':state.csrf}:{}),...options.headers},...options});
  const body=await response.json().catch(()=>({error:'Unexpected server response'}));
  if(!response.ok) throw new Error(body.error||'Request failed');
  return body;
}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2400)}
function enterApp(){ $('landingView').classList.add('hidden');$('authView').classList.add('hidden');$('appView').classList.remove('hidden');$('skipLink').href='#appView';renderAll() }
function showLanding(){ $('landingView').classList.remove('hidden');$('authView').classList.add('hidden');$('appView').classList.add('hidden');$('skipLink').href='#landingMain';$('landingTitle').focus?.() }
function showAuth(mode='signin'){$('landingView').classList.add('hidden');$('authView').classList.remove('hidden');$('appView').classList.add('hidden');$('skipLink').href='#authForm';setAuthMode(mode);$('authTitle').focus?.()}
function setAuthMode(mode){
  const signup=mode==='signup';
  document.querySelectorAll('.signup-only').forEach(element=>element.classList.toggle('hidden',!signup));
  document.querySelectorAll('.signin-only').forEach(element=>element.classList.toggle('hidden',signup));
  $('signInTab').classList.toggle('active',!signup);$('signUpTab').classList.toggle('active',signup);
  $('signInTab').setAttribute('aria-selected',String(!signup));$('signUpTab').setAttribute('aria-selected',String(signup));
  $('authFields').setAttribute('aria-labelledby',signup?'signUpTab':'signInTab');
  $('authTitle').textContent=t(signup?'createYourAccount':'welcomeBack');$('authIntro').textContent=t(signup?'signUpIntro':'signInIntro');$('signInButton').textContent=t(signup?'createAccount':'signIn');
  $('signupBusiness').required=signup;$('signupOwner').required=signup;$('confirmPassword').required=signup;$('termsConsent').required=signup;
  if(signup){$('authCode').pattern='(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}'}else{$('authCode').removeAttribute('pattern')}
  $('authCode').autocomplete=signup?'new-password':'current-password';$('authForm').dataset.mode=mode;$('authError').textContent='';
}
function showStaffControls(enabled){document.querySelectorAll('.staff-only').forEach(el=>el.classList.toggle('hidden',!enabled));$('sessionLabel').classList.toggle('hidden',enabled);$('sessionLabel').textContent=t('customer')}

async function loadCatalog(){const data=await api('/api/products');state.products=data.products;state.vatRate=data.vatRate;renderAll()}
function renderAll(){renderCategories();renderProducts();renderCart();renderManager();renderFinancialWorkspace();}
function renderCategories(){const categories=['All',...new Set(state.products.map(p=>p.category))];$('categoryRow').innerHTML=categories.map(name=>{const translated=name==='All'?t('all'):(preferences.language==='es'?(translations.products[state.products.find(p=>p.category===name)?.id]?.[1]||name):name);return`<button type="button" class="category-button ${state.category===name?'active':''}" data-category="${escapeHtml(name)}">${escapeHtml(translated)}</button>`}).join('')}
function visibleProducts(){return state.products.filter(product=>(state.category==='All'||product.category===state.category)&&productMatchesSearch(product,state.query))}
function renderProducts(){const shown=visibleProducts();$('productGrid').innerHTML=shown.length?shown.map((p,index)=>{const copy=productCopy(p);return`<article class="product-card" data-slide="${index}"><div class="product-image"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(copy.name)}" loading="lazy"></div><div class="product-content"><div class="product-top"><h2>${escapeHtml(copy.name)}</h2><span class="product-price">${money(p.priceCents)}</span></div><p class="product-description">${escapeHtml(copy.description)}</p><div class="product-footer"><span class="stock">${p.stock>0?`${p.stock} ${t('available')}`:t('soldOut')}</span><button class="add-button" type="button" data-add="${p.id}" ${p.stock<1?'disabled':''}>${t('add')}</button></div></div></article>`}).join(''):`<p class="empty-state">${t('noProducts')}</p>`;state.carouselIndex=Math.min(state.carouselIndex,Math.max(0,shown.length-1));updateCarouselStatus()}
function carouselStep(){const first=$('productGrid').querySelector('.product-card');return first?first.getBoundingClientRect().width+18:0}
function visibleCarouselCards(){const step=carouselStep();return step?Math.max(1,Math.floor(($('productGrid').clientWidth+18)/step)):1}
function moveCarousel(direction){const shown=visibleProducts();if(!shown.length)return;const visible=visibleCarouselCards();state.carouselIndex=Math.max(0,Math.min(state.carouselIndex+direction,Math.max(0,shown.length-visible)));$('productGrid').scrollTo({left:state.carouselIndex*carouselStep(),behavior:'smooth'});updateCarouselStatus()}
function updateCarouselStatus(){const shown=visibleProducts();const visible=visibleCarouselCards();const last=Math.min(shown.length,state.carouselIndex+visible);$('carouselPosition').textContent=shown.length?`${state.carouselIndex+1}–${last} / ${shown.length}`:'0 / 0';$('previousProduct').disabled=state.carouselIndex===0;$('nextProduct').disabled=!shown.length||last>=shown.length}
function renderCart(){let count=0;const lines=[];for(const [id,quantity] of state.cart){const p=state.products.find(item=>item.id===id);if(!p)continue;const copy=productCopy(p);count+=quantity;lines.push(`<div class="cart-line"><img src="${escapeHtml(p.imageUrl)}" alt=""><div><strong>${escapeHtml(copy.name)}</strong><small>${money(p.priceCents)} ${t('each')}</small></div><div class="qty-controls"><button type="button" data-minus="${id}" aria-label="− ${escapeHtml(copy.name)}">−</button><b>${quantity}</b><button type="button" data-plus="${id}" aria-label="+ ${escapeHtml(copy.name)}">+</button></div></div>`)}$('cartCount').textContent=count;$('cartLines').innerHTML=lines.join('')||`<p class="empty-state">${t('emptyOrder')}</p>`;$('clearOrder').disabled=!count;calculateTotals()}
async function calculateTotals(){const version=++state.quoteVersion;const items=[...state.cart].map(([productId,quantity])=>({productId,quantity}));try{const totals=items.length?await api('/api/orders/quote',{method:'POST',body:JSON.stringify({items})}):{subtotalCents:0,vatCents:0,totalCents:0,vatRate:state.vatRate||15};if(version!==state.quoteVersion)return;$('subtotal').textContent=money(totals.subtotalCents);$('vat').textContent=money(totals.vatCents);$('total').textContent=money(totals.totalCents);$('vatLabel').textContent=`${preferences.language==='es'?'IVA':'VAT'} (${totals.vatRate}%)`;$('placeOrder').disabled=!items.length}catch(error){if(version===state.quoteVersion)toast(localizeError(error))}}
function applyInventoryChange(product,action,quantity){if(!Number.isInteger(quantity)||quantity<1||quantity>9999)throw new Error('Enter a valid whole quantity.');product.returned=Number(product.returned||0);product.damaged=Number(product.damaged||0);product.sold=Number(product.sold||0);if(action==='add'||action==='return')product.stock+=quantity;if(action==='return')product.returned+=quantity;if(action==='damage'||action==='sold'){if(quantity>product.stock)throw new Error('Quantity exceeds available inventory.');product.stock-=quantity;product[action==='damage'?'damaged':'sold']+=quantity}}
function financialSummary(){
  return state.products.reduce((summary,product)=>{
    const availableUnits=Math.max(0,Number(product.stock)||0);
    const soldUnits=Math.max(0,Number(product.sold)||0);
    const damagedUnits=Math.max(0,Number(product.damaged)||0);
    const sellingPriceCents=Math.max(0,Number(product.priceCents)||0);
    const procurementCostCents=Math.max(0,Number(product.procurementCostCents)||0);
    const salesCents=Math.round(sellingPriceCents*soldUnits);
    const vatRate=Math.max(0,Number(product.vatRate??state.vatRate)||0);
    const taxCents=Math.round(salesCents*vatRate/100);
    summary.inventoryUnits+=availableUnits;
    summary.inventoryValueCents+=availableUnits*procurementCostCents;
    summary.soldUnits+=soldUnits;
    summary.salesCents+=salesCents;
    summary.taxCents+=taxCents;
    summary.cogsCents+=soldUnits*procurementCostCents;
    summary.damagedCostCents+=damagedUnits*procurementCostCents;
    return summary;
  },{inventoryUnits:0,inventoryValueCents:0,soldUnits:0,salesCents:0,taxCents:0,cogsCents:0,damagedCostCents:0});
}
function renderFinancialWorkspace(){
  const summary=financialSummary();
  const customerCollectedCents=summary.salesCents+summary.taxCents;
  const grossProfitCents=summary.salesCents-summary.cogsCents;
  const netProductProfitCents=grossProfitCents-summary.damagedCostCents;
  $('inventoryUnits').textContent=t('inventoryUnitCount',{count:summary.inventoryUnits});
  $('inventoryValue').textContent=money(summary.inventoryValueCents);
  $('salesValue').textContent=money(summary.salesCents);
  $('taxesValue').textContent=money(summary.taxCents);
  $('grossValue').textContent=money(grossProfitCents);
  $('cogsValue').textContent=money(summary.cogsCents);
  $('netValue').textContent=money(netProductProfitCents);
  $('damagedValue').textContent=money(summary.damagedCostCents);
  $('inventorySummaryValue').textContent=money(summary.inventoryValueCents);
  $('salesSummaryValue').textContent=money(summary.salesCents);
  $('taxesSummaryValue').textContent=money(summary.taxCents);
  $('customerCollectedValue').textContent=money(customerCollectedCents);
  $('cogsSummaryValue').textContent=money(summary.cogsCents);
  $('grossSummaryValue').textContent=money(grossProfitCents);
  $('damagedSummaryValue').textContent=money(summary.damagedCostCents);
  $('netSummaryValue').textContent=money(netProductProfitCents);
  $('resetInventoryButton').disabled=summary.inventoryUnits===0;
  document.querySelectorAll('[data-finance-tab]').forEach(button=>{
    const active=button.dataset.financeTab===state.financeView;
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
  });
  document.querySelectorAll('[data-finance-panel]').forEach(panel=>panel.classList.toggle('hidden',panel.dataset.financePanel!==state.financeView));
}
function switchFinanceView(view){
  if(!['inventory','sales','taxes','gross','net','summary'].includes(view))return;
  state.financeView=view;
  renderFinancialWorkspace();
}
function renderManager(){const products=state.products.filter(product=>productMatchesSearch(product,state.manageQuery));$('capacityLabel').textContent=`${state.products.length} / 20`;$('manageList').innerHTML=products.map(p=>{const copy=productCopy(p);return`<article class="manage-item"><div class="manage-product"><img src="${escapeHtml(p.imageUrl)}" alt=""><div class="manage-summary"><div><strong>${escapeHtml(copy.name)}</strong><span class="inventory-status ${p.stock<1?'sold-out':''}">${p.stock<1?t('soldOut'):t('inStock')}</span></div><small>${escapeHtml(copy.category)} · ${t('purchased')} ${escapeHtml(p.purchaseDate||t('notRecorded'))}</small></div></div><div class="item-price"><span>${t('price')}</span><strong>${money(p.priceCents)}</strong></div><div class="inventory-actions"><label class="inventory-control"><span>${t('quantity')}</span><input type="number" min="1" max="9999" step="1" value="1" aria-label="${t('quantity')} ${escapeHtml(copy.name)}" data-inventory-quantity="${p.id}"></label><label class="inventory-control inventory-action-select"><span>${t('inventoryAction')}</span><select aria-label="${t('inventoryAction')} ${escapeHtml(copy.name)}" data-inventory-action="${p.id}"><option value="add">${t('addInventory')}</option><option value="return">${t('return')}</option><option value="damage">${t('damage')}</option><option value="sold">${t('sold')}</option></select></label><label class="inventory-control"><span>${t('vatShort')}</span><input type="number" min="0" max="100" step="0.01" value="${Number(p.vatRate??state.vatRate)}" aria-label="${t('vat')} ${escapeHtml(copy.name)}" data-inventory-vat="${p.id}"></label><label class="inventory-control inventory-date"><span>${t('purchaseDate')}</span><input type="date" value="${escapeHtml(p.purchaseDate||'')}" aria-label="${t('purchaseDate')} ${escapeHtml(copy.name)}" data-inventory-date="${p.id}"></label><div class="inventory-action-buttons" aria-label="${t('productActions')} ${escapeHtml(copy.name)}"><button class="button inventory-button" type="button" data-inventory-apply="${p.id}">${t('apply')}</button><button class="button edit-button" type="button" data-edit="${p.id}">${t('edit')}</button><button class="delete-button" type="button" data-delete="${p.id}">${t('delete')}</button></div></div></article>`}).join('')||`<p class="empty-state">${t('noInventory')}</p>`;updateProductAction()}
function renderProductPreview(){const value=(id,fallback)=>$(id).value.trim()||fallback;$('previewName').textContent=value('productName',t('productName'));$('previewCategory').textContent=value('productCategory',t('category'));$('previewPrice').textContent=money(Math.round((Number($('productPrice').value)||0)*100));$('previewVat').textContent=`${Number($('productVat').value)||0}%`;$('previewStock').textContent=String(Number($('productStock').value)||0);$('previewDate').textContent=$('productPurchaseDate').value||t('notSelected');$('previewDescription').textContent=value('productDescription',t('shortDescription'))}
function updateProductAction(){const button=$('productSubmitButton');const updateButton=$('updateItemButton');const editing=Boolean(state.editingProductId);const atCapacity=state.products.length>=20;const complete=$('productForm').checkValidity()&&Boolean(state.imageData);button.textContent=editing?t('updateProduct'):t('publishProduct');button.classList.toggle('hidden',!complete||(!editing&&atCapacity));updateButton.disabled=!editing||!complete;$('capacityMessage').classList.toggle('hidden',editing||!atCapacity)}
function clearProductForm(message=''){state.editingProductId=null;state.imageData='';$('productForm').reset();$('productVat').value='15';for(const id of ['uploadPreview','previewPicture']){$(id).style.backgroundImage='';$(id).classList.remove('has-image')}renderProductPreview();updateProductAction();$('productMessage').textContent=message}
function editProduct(product){state.editingProductId=product.id;$('productName').value=product.name;$('productCategory').value=product.category;$('productPrice').value=(product.priceCents/100).toFixed(2);$('productProcurementCost').value=product.procurementCostCents?((product.procurementCostCents/100).toFixed(2)):'';$('productVat').value=Number(product.vatRate??state.vatRate);$('productStock').value=product.stock;$('productPurchaseDate').value=product.purchaseDate||'';$('productDescription').value=product.description;state.imageData=product.imageUrl;for(const id of ['uploadPreview','previewPicture']){$(id).style.backgroundImage=`url(${product.imageUrl})`;$(id).classList.add('has-image')}renderProductPreview();updateProductAction();$('productForm').scrollIntoView({behavior:'smooth',block:'start'});$('productMessage').textContent=t('editing',{name:productCopy(product).name})}
function openCart(open){$('cartDrawer').classList.toggle('open',open);$('scrim').classList.toggle('open',open);$('cartDrawer').setAttribute('aria-hidden',String(!open))}
function switchView(view){$('catalogView').classList.toggle('hidden',view!=='catalog');$('manageView').classList.toggle('hidden',view!=='manage');$('settingsView').classList.toggle('hidden',view!=='settings');document.querySelectorAll('.nav-button').forEach(button=>{const active=button.dataset.view===view;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});$('ownerSettingsButton').classList.toggle('active',view==='settings');$('ownerSettingsButton').setAttribute('aria-pressed',String(view==='settings'))}


function loadBusinessProfile(){try{return{...defaultBusinessProfile,...JSON.parse(localStorage.getItem('cappeto_business_profile')||'{}')}}catch{return{...defaultBusinessProfile}}}
function paintBusinessLogo(element,logo,name){element.style.backgroundImage=logo?`url("${logo}")`:'';element.classList.toggle('has-logo',Boolean(logo));const label=element.querySelector('span')||element;label.textContent=logo?'':(name.trim().charAt(0)||'C').toUpperCase()}
function applyBusinessProfile(fillForm=false){$('businessWordmark').textContent=businessProfile.name||'Cappeto';paintBusinessLogo($('businessLogoMark'),businessProfile.logo,businessProfile.name);paintBusinessLogo($('businessLogoPreview'),pendingBusinessLogo,businessProfile.name);if(fillForm){$('businessName').value=businessProfile.name;$('businessAddress').value=businessProfile.address;$('businessPhone').value=businessProfile.phone;$('businessEmail').value=businessProfile.email;$('businessCurrency').value=businessProfile.currency||'USD';$('businessProfileMessage').textContent=''}}
async function toBusinessLogo(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('chooseImage');if(file.size>8*1024*1024)throw new Error('imageSize');const bitmap=await createImageBitmap(file);const scale=Math.min(1,400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',.82)}
applyBusinessProfile();
const rememberedEmail=localStorage.getItem('cappeto_remembered_email')||'';if(rememberedEmail){$('staffEmail').value=rememberedEmail;$('rememberMe').checked=true}

$('openSignIn').addEventListener('click',()=>showAuth('signin'));$('openSignUp').addEventListener('click',()=>showAuth('signup'));$('landingCreateAccount').addEventListener('click',()=>showAuth('signup'));$('authBack').addEventListener('click',showLanding);document.querySelectorAll('[data-auth-home]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();showLanding()}));
$('signInTab').addEventListener('click',()=>setAuthMode('signin'));$('signUpTab').addEventListener('click',()=>setAuthMode('signup'));
[['gmailButton','Gmail'],['appleButton','Apple']].forEach(([id,provider])=>$(id).addEventListener('click',()=>{$('authError').textContent=t('providerBackendRequired',{provider})}));
$('passwordToggle').addEventListener('click',()=>{const visible=$('authCode').type==='text';$('authCode').type=visible?'password':'text';$('passwordToggle').textContent=t(visible?'showPassword':'hidePassword');$('passwordToggle').setAttribute('aria-pressed',String(!visible));$('authCode').focus()});
$('landingBrowse').addEventListener('click',async()=>{showStaffControls(false);await loadCatalog();enterApp()});
$('forgotPassword').addEventListener('click',()=>{$('authError').textContent=t('passwordResetInfo')});
$('authForm').addEventListener('submit',async event=>{event.preventDefault();$('authError').textContent='';if(event.currentTarget.dataset.mode==='signup'){if($('authCode').value!==$('confirmPassword').value){$('authError').textContent=t('passwordMismatch');return}$('authError').textContent=t('signupBackendRequired');return}const button=$('signInButton');button.disabled=true;button.setAttribute('aria-busy','true');button.textContent=t('signingIn');try{const email=$('staffEmail').value.trim();const result=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password:$('authCode').value})});if($('rememberMe').checked)localStorage.setItem('cappeto_remembered_email',email);else localStorage.removeItem('cappeto_remembered_email');state.staff=result.user;state.csrf=result.csrfToken;showStaffControls(true);await loadCatalog();enterApp()}catch(error){$('authError').textContent=localizeError(error)}finally{button.disabled=false;button.removeAttribute('aria-busy');button.textContent=t('signIn')}});
$('browseButton').addEventListener('click',async()=>{showStaffControls(false);await loadCatalog();enterApp()});
$('logoutButton').addEventListener('click',async()=>{await api('/api/auth/logout',{method:'POST',body:'{}'});location.reload()});
$('categoryRow').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(!button)return;state.category=button.dataset.category;state.carouselIndex=0;renderCategories();renderProducts()});
$('productGrid').addEventListener('click',event=>{const id=event.target.closest('[data-add]')?.dataset.add;if(!id)return;const p=state.products.find(item=>item.id===id);const quantity=Math.min((state.cart.get(id)||0)+1,p.stock);state.cart.set(id,quantity);renderCart();toast(t('productAdded',{name:productCopy(p).name}))});
$('searchInput').addEventListener('input',event=>{state.query=event.target.value;state.carouselIndex=0;renderProducts()});
$('previousProduct').addEventListener('click',()=>moveCarousel(-1));$('nextProduct').addEventListener('click',()=>moveCarousel(1));
$('productGrid').addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();moveCarousel(1)}if(event.key==='ArrowLeft'){event.preventDefault();moveCarousel(-1)}});
$('productGrid').addEventListener('scroll',()=>{clearTimeout(state.carouselTimer);state.carouselTimer=setTimeout(()=>{const step=carouselStep();if(step){state.carouselIndex=Math.round($('productGrid').scrollLeft/step);updateCarouselStatus()}},80)});
window.addEventListener('resize',()=>{clearTimeout(state.resizeTimer);state.resizeTimer=setTimeout(()=>{state.carouselIndex=0;$('productGrid').scrollTo({left:0});updateCarouselStatus()},120)});
$('cartButton').addEventListener('click',()=>openCart(true));$('closeCart').addEventListener('click',()=>openCart(false));$('scrim').addEventListener('click',()=>openCart(false));
$('clearOrder').addEventListener('click',()=>{if(!state.cart.size)return;state.cart.clear();renderCart();toast(t('orderCleared'))});
$('cartLines').addEventListener('click',event=>{const plus=event.target.closest('[data-plus]')?.dataset.plus;const minus=event.target.closest('[data-minus]')?.dataset.minus;const id=plus||minus;if(!id)return;const p=state.products.find(item=>item.id===id);const next=(state.cart.get(id)||0)+(plus?1:-1);if(next<=0)state.cart.delete(id);else state.cart.set(id,Math.min(next,p.stock));renderCart()});
document.querySelectorAll('.nav-button').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.view)));
$('ownerSettingsButton').addEventListener('click',()=>{pendingBusinessLogo=businessProfile.logo;applyBusinessProfile(true);switchView('settings');$('settingsTitle').focus?.()});
$('businessLogo').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{pendingBusinessLogo=await toBusinessLogo(file);paintBusinessLogo($('businessLogoPreview'),pendingBusinessLogo,$('businessName').value||businessProfile.name);$('businessProfileMessage').textContent=''}catch(error){$('businessProfileMessage').textContent=localizeError(error)}});
$('businessName').addEventListener('input',()=>paintBusinessLogo($('businessLogoPreview'),pendingBusinessLogo,$('businessName').value||'Cappeto'));
$('businessProfileForm').addEventListener('submit',event=>{event.preventDefault();if(!event.currentTarget.checkValidity()){event.currentTarget.reportValidity();return}businessProfile={name:$('businessName').value.trim(),logo:pendingBusinessLogo,address:$('businessAddress').value.trim(),phone:$('businessPhone').value.trim(),email:$('businessEmail').value.trim(),currency:$('businessCurrency').value};localStorage.setItem('cappeto_business_profile',JSON.stringify(businessProfile));applyBusinessProfile();$('businessProfileMessage').textContent=t('settingsSaved');toast(t('settingsSaved'))});
$('productImage').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{state.imageData=await toWebP(file);for(const id of ['uploadPreview','previewPicture']){$(id).style.backgroundImage=`url(${state.imageData})`;$(id).classList.add('has-image')}$('productMessage').textContent='';updateProductAction()}catch(error){state.imageData='';$('productMessage').textContent=localizeError(error);updateProductAction()}});
$('removePictureButton').addEventListener('click',()=>{state.imageData='';$('productImage').value='';for(const id of ['uploadPreview','previewPicture']){$(id).style.backgroundImage='';$(id).classList.remove('has-image')}updateProductAction();$('productMessage').textContent=t('pictureRequired')});
$('productForm').addEventListener('input',()=>{renderProductPreview();updateProductAction()});
$('clearProductButton').addEventListener('click',()=>clearProductForm(t('fieldsCleared')));
async function toWebP(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('chooseImage');if(file.size>8*1024*1024)throw new Error('imageSize');const bitmap=await createImageBitmap(file);const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/webp',.84)}
$('productForm').addEventListener('submit',async event=>{event.preventDefault();if(!event.target.checkValidity()||!state.imageData){$('productMessage').textContent=t('pictureRequired');return}const editingId=state.editingProductId;const payload={name:$('productName').value,category:$('productCategory').value,description:$('productDescription').value,price:Number($('productPrice').value),procurementCost:Number($('productProcurementCost').value),vatRate:Number($('productVat').value),stock:Number($('productStock').value),purchaseDate:$('productPurchaseDate').value,imageData:state.imageData};try{await api(editingId?`/api/products/${encodeURIComponent(editingId)}`:'/api/products',{method:editingId?'PUT':'POST',body:JSON.stringify(payload)});clearProductForm(t(editingId?'updated':'published'));await loadCatalog();$('manageList').scrollIntoView({behavior:'smooth',block:'start'})}catch(error){$('productMessage').textContent=localizeError(error)}});
$('resetInventoryButton').addEventListener('click',async()=>{
  const button=$('resetInventoryButton');
  if(financialSummary().inventoryUnits===0){toast(t('inventoryAlreadyZero'));return}
  if(!confirm(t('resetInventoryConfirm')))return;
  button.disabled=true;
  button.setAttribute('aria-busy','true');
  try{
    await api('/api/inventory/reset',{method:'POST',body:'{}'});
    await loadCatalog();
    toast(t('inventoryReset'));
  }catch(error){
    button.disabled=false;
    toast(localizeError(error));
  }finally{
    button.removeAttribute('aria-busy');
  }
});
document.querySelectorAll('.tax-disclosure-button').forEach(button=>button.addEventListener('click',()=>{
  const disclosure=$(button.getAttribute('aria-controls'));
  const open=button.getAttribute('aria-expanded')==='true';
  button.setAttribute('aria-expanded',String(!open));
  disclosure.classList.toggle('hidden',open);
}));
document.querySelector('.finance-tabs').addEventListener('click',event=>{
  const button=event.target.closest('[data-finance-tab]');
  if(!button)return;
  switchFinanceView(button.dataset.financeTab);
});
document.querySelector('.finance-tabs').addEventListener('keydown',event=>{
  const tabs=[...document.querySelectorAll('[data-finance-tab]')];
  const current=tabs.indexOf(document.activeElement);
  if(current<0)return;
  let next=current;
  if(event.key==='ArrowRight')next=(current+1)%tabs.length;
  else if(event.key==='ArrowLeft')next=(current-1+tabs.length)%tabs.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=tabs.length-1;
  else return;
  event.preventDefault();
  switchFinanceView(tabs[next].dataset.financeTab);
  tabs[next].focus();
});
$('manageSearch').addEventListener('input',event=>{state.manageQuery=event.target.value;renderManager()});
$('manageList').addEventListener('click',async event=>{const editId=event.target.closest('[data-edit]')?.dataset.edit;if(editId){const product=state.products.find(item=>item.id===editId);if(product)editProduct(product);return}const applyId=event.target.closest('[data-inventory-apply]')?.dataset.inventoryApply;if(applyId){const escaped=CSS.escape(applyId);const quantity=Number(document.querySelector(`[data-inventory-quantity="${escaped}"]`).value);const action=document.querySelector(`[data-inventory-action="${escaped}"]`).value;const vatRate=Number(document.querySelector(`[data-inventory-vat="${escaped}"]`).value);const purchaseDate=document.querySelector(`[data-inventory-date="${escaped}"]`).value;try{await api(`/api/products/${encodeURIComponent(applyId)}/inventory`,{method:'PATCH',body:JSON.stringify({action,quantity,vatRate,purchaseDate})});await loadCatalog();toast(t('inventoryUpdated'))}catch(error){toast(localizeError(error))}return}const id=event.target.closest('[data-delete]')?.dataset.delete;if(!id||!confirm(t('deleteConfirm')))return;try{await api(`/api/products/${encodeURIComponent(id)}`,{method:'DELETE'});state.cart.delete(id);await loadCatalog();toast(t('productDeleted'))}catch(error){toast(localizeError(error))}});
$('placeOrder').addEventListener('click',async()=>{const items=[...state.cart].map(([productId,quantity])=>({productId,quantity}));try{const result=await api('/api/orders',{method:'POST',body:JSON.stringify({items})});state.cart.clear();await loadCatalog();openCart(false);toast(t('orderPlaced',{id:result.orderId,total:money(result.totalCents)}))}catch(error){toast(localizeError(error))}});

api('/api/auth/session').then(async result=>{if(result.authenticated){state.staff=result.user;state.csrf=result.csrfToken;showStaffControls(true);await loadCatalog();enterApp()}}).catch(()=>{});
