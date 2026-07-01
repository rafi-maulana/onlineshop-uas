import{c as e,t}from"./api-oIbjfTyr.js";var n=JSON.parse(localStorage.getItem(`cart`))||[],r=document.getElementById(`cartItems`),i=document.getElementById(`cartTotal`),a=document.getElementById(`checkoutForm`),o=new Intl.NumberFormat(`id-ID`,{style:`currency`,currency:`IDR`,maximumFractionDigits:0});function s(){(localStorage.getItem(`theme`)||`dark`)===`light`?document.documentElement.classList.remove(`dark`):document.documentElement.classList.add(`dark`)}function c(){r.innerHTML=``;let e=0;if(n.length===0){r.innerHTML=`
            <div class="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p class="text-slate-400 font-semibold text-lg">Keranjang belanja Anda kosong.</p>
                <p class="text-slate-500 text-sm mt-1">Silakan kembali belanja untuk menambahkan produk.</p>
            </div>
        `,i.textContent=`Rp 0`;return}n.forEach((t,n)=>{e+=t.price*t.quantity;let i=document.createElement(`div`);i.className=`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-6 gap-4`,i.innerHTML=`
            <div class="flex items-center gap-4">
                <img src="${t.image_url}" class="w-20 h-20 object-cover rounded-2xl border border-white/5">
                <div>
                    <h4 class="font-bold text-white text-base leading-snug">${t.name}</h4>
                    <p class="text-sm text-slate-400 mt-1">${o.format(t.price)}</p>
                </div>
            </div>
            <div class="flex items-center justify-between w-full sm:w-auto gap-6 mt-2 sm:mt-0">
                <div class="flex items-center bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                    <button class="px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer" onclick="updateQty(${n}, -1)">&minus;</button>
                    <span class="px-4 font-bold text-white text-sm">${t.quantity}</span>
                    <button class="px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer" onclick="updateQty(${n}, 1)">&plus;</button>
                </div>
                <button class="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition cursor-pointer" onclick="removeItem(${n})">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `,r.appendChild(i)}),i.textContent=o.format(e)}window.updateQty=(e,t)=>{n[e].quantity+=t,n[e].quantity<=0&&n.splice(e,1),localStorage.setItem(`cart`,JSON.stringify(n)),c()},window.removeItem=e=>{n.splice(e,1),localStorage.setItem(`cart`,JSON.stringify(n)),c()};function l(){let e=JSON.parse(localStorage.getItem(`user`));e&&(document.getElementById(`custName`)&&(document.getElementById(`custName`).value=e.name||``),document.getElementById(`custPhone`)&&(document.getElementById(`custPhone`).value=e.phone||``),document.getElementById(`custAddress`)&&(document.getElementById(`custAddress`).value=e.address||``))}a.addEventListener(`submit`,async r=>{if(r.preventDefault(),n.length===0){alert(`Keranjang belanja Anda kosong!`);return}let i=document.getElementById(`custName`).value,a=document.getElementById(`custPhone`).value,s=document.getElementById(`custAddress`).value,c=n.reduce((e,t)=>e+t.price*t.quantity,0),l=JSON.parse(localStorage.getItem(`user`)),u=`TX-${Date.now()}`,d={customer_name:i,customer_email:l?l.email:null,phone:a,address:s,total_price:c,cart_items:n.map(e=>({id:e.id,quantity:e.quantity,price:e.price}))},f=u;try{let r=`6287706335584`;try{let t=await e();t&&t.owner_phone&&(r=t.owner_phone)}catch{console.log(`Menggunakan nomor WA owner default.`)}try{f=(await t(d)).order_id}catch{console.log(`Koneksi API gagal, pesanan hanya akan disimpan secara lokal di browser (Mode UTS).`)}let u=JSON.parse(localStorage.getItem(`orders`))||[],p={id:f,customer_name:i,customer_email:l?l.email:`guest@guest.com`,address:s,phone:a,total_price:c,status:`pending`,items:n.map(e=>({product_id:e.id,product_name:e.name,quantity:e.quantity,price:e.price,image_url:e.image_url})),created_at:new Date().toISOString()};u.push(p),localStorage.setItem(`orders`,JSON.stringify(u));let m=[];m.push(`🛒 *PESANAN BARU #${f}*`),m.push(`━━━━━━━━━━━━━━━━━━━━`),m.push(`👤 *Nama:* ${i}`),m.push(`📱 *WhatsApp:* ${a}`),m.push(`📍 *Alamat:* ${s}`),m.push(``),m.push(`📦 *Detail Pesanan:*`),n.forEach(e=>{m.push(`  • ${e.name}`),m.push(`    ${e.quantity}x ${o.format(e.price)} = ${o.format(e.price*e.quantity)}`)}),m.push(``),m.push(`━━━━━━━━━━━━━━━━━━━━`),m.push(`💰 *TOTAL: ${o.format(c)}*`),m.push(``),m.push(`_Mohon konfirmasi pesanan ini. Terima kasih!_ 🙏`);let h=encodeURIComponent(m.join(`
`));localStorage.removeItem(`cart`),window.open(`https://wa.me/${r}?text=${h}`,`_blank`),window.location.href=`orders.html`}catch{alert(`Checkout gagal. Silakan coba kembali.`)}});async function u(){try{let t=await e();if(t&&t.shop_name){document.title=`Keranjang Anda - ${t.shop_name}`;let e=document.querySelector(`nav a`);e&&(e.textContent=t.shop_name)}}catch{console.log(`API Settings offline.`)}}s(),u(),l(),c();