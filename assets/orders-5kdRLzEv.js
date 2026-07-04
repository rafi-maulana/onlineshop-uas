import{d as e,l as t,s as n}from"./api-B1LYbknR.js";var r=JSON.parse(localStorage.getItem(`user`)),i=JSON.parse(localStorage.getItem(`cart`))||[];document.getElementById(`cartCount`).textContent=i.reduce((e,t)=>e+t.quantity,0),t().then(e=>{e&&e.shop_name&&(document.getElementById(`logoText`).textContent=e.shop_name,document.title=`Pesanan Saya - ${e.shop_name}`)}).catch(()=>{});var a=new Intl.NumberFormat(`id-ID`,{style:`currency`,currency:`IDR`,maximumFractionDigits:0}),o={cash:`Tunai (Cash)`,bank_transfer:`Transfer Bank`,dana:`Dana`,gopay:`GoPay`,ovo:`OVO`,shopeepay:`ShopeePay`},s={pending:{label:`Menunggu`,class:`bg-amber-500/10 text-amber-400 border-amber-500/20`,dot:`bg-amber-400`},processing:{label:`Diproses`,class:`bg-blue-500/10 text-blue-400 border-blue-500/20`,dot:`bg-blue-400`},shipped:{label:`Dikirim`,class:`bg-indigo-500/10 text-indigo-400 border-indigo-500/20`,dot:`bg-indigo-400`},completed:{label:`Selesai`,class:`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`,dot:`bg-emerald-400`},cancelled:{label:`Dibatalkan`,class:`bg-red-500/10 text-red-400 border-red-500/20`,dot:`bg-red-400`}};function c(e){let t=[`pending`,`processing`,`shipped`,`completed`];return e===`cancelled`?{steps:[`pending`,`cancelled`],current:`cancelled`,isCancelled:!0}:{steps:t,current:e,currentIdx:t.indexOf(e),isCancelled:!1}}function l(e){let{steps:t,currentIdx:n,isCancelled:r}=c(e);return r?`
                    <div class="flex items-center gap-2 mt-4">
                        <div class="flex-1 h-1 bg-red-500/20 rounded-full"></div>
                        <span class="text-xs font-bold text-red-400 uppercase tracking-wider px-2">Pesanan Dibatalkan</span>
                        <div class="flex-1 h-1 bg-red-500/20 rounded-full"></div>
                    </div>
                `:`
                <div class="mt-5 pt-4 border-t border-white/5">
                    <div class="flex items-center justify-between gap-1">
                        ${t.map((e,r)=>{let i=r<=n,a=r===n;return s[e],`
                                <div class="flex flex-col items-center flex-1">
                                    <div class="relative w-full flex items-center">
                                        ${r>0?`<div class="flex-1 h-0.5 ${i?`bg-violet-500`:`bg-slate-700`} transition-all duration-500"></div>`:`<div class="flex-1"></div>`}
                                        <div class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300 ${a?`border-violet-400 bg-violet-500/20 scale-110`:i?`border-violet-600 bg-violet-600`:`border-slate-700 bg-slate-900`}">
                                            ${i&&!a?`<svg class="w-3.5 h-3.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`:``}
                                            ${a?`<span class="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse"></span>`:``}
                                        </div>
                                        ${r<t.length-1?`<div class="flex-1 h-0.5 ${r<n?`bg-violet-500`:`bg-slate-700`} transition-all duration-500"></div>`:`<div class="flex-1"></div>`}
                                    </div>
                                    <span class="text-xs mt-2 font-semibold capitalize ${a?`text-violet-400`:i?`text-slate-300`:`text-slate-600`}">${s[e].label}</span>
                                </div>
                            `}).join(``)}
                    </div>
                </div>
            `}function u(t){let n=document.getElementById(`ordersList`);n.innerHTML=``,t.forEach(t=>{let r=s[t.status]||s.pending,i=document.createElement(`div`);i.className=`glass rounded-3xl border border-white/5 p-6 md:p-8 shadow-xl`,i.innerHTML=`
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                        <div>
                            <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider">ID Pesanan</p>
                            <h3 class="text-xl font-extrabold text-white">#${t.id}</h3>
                        </div>
                        <div class="flex flex-col sm:items-end gap-2">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${r.class}">
                                <span class="w-1.5 h-1.5 rounded-full ${r.dot} ${t.status===`pending`||t.status===`processing`?`animate-pulse`:``}"></span>
                                ${r.label}
                            </span>
                            <p class="text-xs text-slate-500">${new Date(t.created_at).toLocaleDateString(`id-ID`,{year:`numeric`,month:`long`,day:`numeric`,hour:`2-digit`,minute:`2-digit`})}</p>
                        </div>
                    </div>

                    <!-- Items -->
                    ${t.items&&t.items.length>0?`
                        <div class="space-y-3 mb-5">
                            ${t.items.slice(0,3).map(t=>`
                                <div class="flex items-center gap-4 bg-slate-900/40 rounded-2xl p-3">
                                    ${t.image_url?`<img src="${e(t.image_url)}" class="w-12 h-12 rounded-xl object-cover border border-white/5 flex-shrink-0">`:`<div class="w-12 h-12 rounded-xl bg-slate-800 flex-shrink-0"></div>`}
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-bold text-white truncate">${t.product_name||`Produk`}</p>
                                        <p class="text-xs text-slate-400">${t.quantity}x • ${a.format(t.price)}</p>
                                    </div>
                                    <p class="text-sm font-bold text-slate-300 flex-shrink-0">${a.format(t.price*t.quantity)}</p>
                                </div>
                            `).join(``)}
                            ${t.items.length>3?`<p class="text-xs text-slate-500 text-center">+${t.items.length-3} produk lainnya</p>`:``}
                        </div>
                    `:``}

                    <!-- Order Info Grid -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-white/5 border-b">
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Pelanggan</p>
                            <p class="text-sm font-bold text-white">${t.customer_name}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">No. WhatsApp</p>
                            <p class="text-sm font-bold text-white">${t.phone}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Pembayaran</p>
                            <p class="text-sm font-bold text-white">${o[t.payment_method]||t.payment_method||`-`}</p>
                        </div>
                        <div class="col-span-2 md:col-span-1">
                            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Alamat</p>
                            <p class="text-sm font-bold text-white truncate" title="${t.address}">${t.address}</p>
                        </div>
                    </div>

                    <!-- Status Tracker -->
                    ${l(t.status)}

                    <!-- Total -->
                    <div class="flex justify-between items-center mt-5">
                        <span class="text-sm text-slate-400 font-semibold">Total Pembayaran</span>
                        <span class="text-2xl font-extrabold text-violet-400">${a.format(t.total_price)}</span>
                    </div>
                `,n.appendChild(i)})}function d(){(localStorage.getItem(`theme`)||`dark`)===`light`?document.documentElement.classList.remove(`dark`):document.documentElement.classList.add(`dark`)}async function f(){try{let e=await n(r.email);document.getElementById(`loadingState`).classList.add(`hidden`),e.length===0?(document.getElementById(`emptyState`).classList.remove(`hidden`),document.getElementById(`ordersList`).classList.add(`hidden`)):(document.getElementById(`emptyState`).classList.add(`hidden`),document.getElementById(`ordersList`).classList.remove(`hidden`),u(e))}catch{console.log(`Koneksi API gagal, memuat pesanan dari LocalStorage (Mode UTS).`);let e=(JSON.parse(localStorage.getItem(`orders`))||[]).filter(e=>e.customer_email===r.email);document.getElementById(`loadingState`).classList.add(`hidden`),e.length===0?(document.getElementById(`emptyState`).classList.remove(`hidden`),document.getElementById(`ordersList`).classList.add(`hidden`)):(document.getElementById(`emptyState`).classList.add(`hidden`),document.getElementById(`ordersList`).classList.remove(`hidden`),u(e))}}async function p(){if(d(),!r){document.getElementById(`loadingState`).classList.add(`hidden`),document.getElementById(`notLoggedIn`).classList.remove(`hidden`);return}document.getElementById(`orderSubtitle`).textContent=`Menampilkan daftar pesanan untuk ${r.name}`,await f(),setInterval(async()=>{try{await f()}catch{}},5e3)}p();