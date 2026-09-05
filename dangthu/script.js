const menuBtn=document.querySelector('.menu'),menu=document.querySelector('#menu');menuBtn?.addEventListener('click',()=>menu.classList.toggle('open'));document.querySelectorAll('[data-product]').forEach(a=>a.addEventListener('click',()=>{const input=document.querySelector('input[name="product"]');if(input)input.value=a.dataset.product}));document.querySelector('#consult-form')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const lines=[`Xin chào Đặng Thư, tôi muốn được tư vấn tác phẩm.`,`Họ tên: ${f.get('name')||''}`,`SĐT/Zalo: ${f.get('phone')||''}`,`Mục đích: ${f.get('purpose')||'Chưa chọn'}`,`Chủ đề: ${f.get('theme')||'Chưa chọn'}`,`Ngân sách: ${f.get('budget')||'Chưa chọn'}`,f.get('product')?`Mẫu đang xem: ${f.get('product')}`:'',f.get('message')?`Mong muốn: ${f.get('message')}`:''].filter(Boolean);window.open('https://zalo.me/84908253348','_blank');alert('Thông tin đã được ghi nhận trên trang. Zalo Đặng Thư đang được mở để anh/chị gửi nội dung tư vấn.');});
const toggleProducts=document.querySelector('#toggle-products');
toggleProducts?.addEventListener('click',()=>{const cards=document.querySelector('.cards');const open=cards?.classList.toggle('expanded');toggleProducts.innerHTML=open?'THU GỌN TÁC PHẨM <span>↑</span>':'XEM THÊM TÁC PHẨM <span>↓</span>';});

// V1.7 clickable border art -> related product/category panel
const borderArtData={
  'phuong':{title:'Chủ đề Phượng Hoàng',copy:'Gợi ý các tác phẩm tạo hình phượng, chim và hoa dành cho trưng bày, quà biếu hoặc chế tác theo yêu cầu.',img:'assets/xuong-sam-binh-thuy-tinh.jpg',theme:'Rồng / Phượng',product:'Chim · Phượng · Linh Vật'},
  'rong':{title:'Chủ đề Rồng',copy:'Dành cho khách muốn một bố cục mạnh, trang trọng và có điểm nhấn linh vật. Đặng Thư có thể tư vấn theo kích thước bình và ngân sách.',img:'assets/xuong-sam-binh-thuy-tinh.jpg',theme:'Rồng / Phượng',product:'Tác phẩm chủ đề Rồng'},
  'chim':{title:'Chủ đề Chim & Hoa',copy:'Các bố cục chim kết hợp hoa tạo cảm giác mềm mại, thanh nhã, phù hợp không gian phòng khách hoặc quà tặng.',img:'assets/hoa-mai-nghe-thuat.jpg',theme:'Chim',product:'Bình Hoa Mai Nghệ Thuật'},
  'hoa-mai':{title:'Hoa Mai Nghệ Thuật',copy:'Hoa mai được tạo hình thủ công có thể dùng làm điểm nhấn trong bình rượu sâm hoặc phát triển thành một tác phẩm riêng.',img:'assets/hoa-mai-2-lop.jpg',theme:'Hoa',product:'Hoa Mai 2 Lớp Cánh'},
  'tam-da':{title:'Tác Phẩm Tam Đa',copy:'Chủ đề Phúc · Lộc · Thọ hướng đến mừng thọ, tân gia và các dịp quà tặng trang trọng cho gia đình hoặc đối tác.',img:'assets/tam-da-sam-nghe-thuat.jpg',theme:'Tam Đa',product:'Tác Phẩm Tam Đa'},
  'chim-bay':{title:'Chim Bay & Hoa',copy:'Một hướng tạo hình nhẹ nhàng hơn, kết hợp chuyển động của chim với hoa và đường nét tự nhiên của sâm.',img:'assets/hoa-mai-nghe-thuat.jpg',theme:'Chim',product:'Tác phẩm Chim & Hoa'},
  'may':{title:'Bố Cục Phong Thủy',copy:'Họa tiết mây gợi ý nhóm tác phẩm bố cục theo ý nghĩa riêng. Đây là dòng phù hợp khi khách muốn làm theo một chủ đề chưa có mẫu sẵn.',img:'assets/nghe-thuat-che-tac-thu-cong.jpg',theme:'Theo ý tưởng riêng',product:'Tác Phẩm Theo Chủ Đề Riêng'},
  'tung-da':{title:'Chủ đề Tùng · Đá',copy:'Gợi ý cho các tác phẩm thiên về sự vững chãi, trường tồn và không gian trưng bày truyền thống. Có thể trao đổi để phát triển thành mẫu riêng.',img:'assets/nghe-thuat-che-tac-thu-cong.jpg',theme:'Theo ý tưởng riêng',product:'Chủ đề Tùng · Đá'},
  'hoa-phu':{title:'Hoa Thủ Công',copy:'Các chi tiết hoa có thể phối vào bình rượu sâm, tác phẩm chim, Tam Đa hoặc đặt làm theo kích thước và số lượng mong muốn.',img:'assets/hoa-mai-2-lop.jpg',theme:'Hoa',product:'Hoa thủ công'},
  'lan-da':{title:'Chủ đề Lan · Đá',copy:'Một gợi ý thanh nhã cho nhóm tác phẩm theo yêu cầu, phù hợp khách muốn bố cục mềm hơn và mang nét trang trí truyền thống.',img:'assets/nghe-thuat-che-tac-thu-cong.jpg',theme:'Theo ý tưởng riêng',product:'Chủ đề Lan · Đá'}
};
const borderPanel=document.querySelector('#border-product-panel');
const borderBackdrop=document.querySelector('#border-product-backdrop');
const borderPanelImage=document.querySelector('#border-panel-image');
const borderPanelTitle=document.querySelector('#border-panel-title');
const borderPanelCopy=document.querySelector('#border-panel-copy');
let borderCurrent=null;
function openBorderPanel(key){
  const d=borderArtData[key]; if(!d||!borderPanel)return;
  borderCurrent=d;
  borderPanelTitle.textContent=d.title; borderPanelCopy.textContent=d.copy;
  borderPanelImage.src=d.img; borderPanelImage.alt=d.title;
  borderPanel.classList.add('open'); borderPanel.setAttribute('aria-hidden','false');
  borderBackdrop.hidden=false;
}
function closeBorderPanel(){if(!borderPanel)return;borderPanel.classList.remove('open');borderPanel.setAttribute('aria-hidden','true');borderBackdrop.hidden=true}
document.querySelectorAll('.border-art[data-art]').forEach(btn=>btn.addEventListener('click',()=>openBorderPanel(btn.dataset.art)));
document.querySelector('.border-panel-close')?.addEventListener('click',closeBorderPanel);borderBackdrop?.addEventListener('click',closeBorderPanel);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBorderPanel()});
document.querySelector('#border-panel-products')?.addEventListener('click',()=>{closeBorderPanel();const cards=document.querySelector('.cards');if(cards&&!cards.classList.contains('expanded')){cards.classList.add('expanded');if(toggleProducts)toggleProducts.innerHTML='THU GỌN TÁC PHẨM <span>↑</span>'}});
document.querySelector('#border-panel-consult')?.addEventListener('click',()=>{
  if(!borderCurrent)return;
  const productInput=document.querySelector('input[name="product"]');if(productInput)productInput.value=borderCurrent.product;
  const themeInput=[...document.querySelectorAll('input[name="theme"]')].find(i=>i.value===borderCurrent.theme);if(themeInput)themeInput.checked=true;
  closeBorderPanel();document.querySelector('#tu-van')?.scrollIntoView({behavior:'smooth',block:'start'});
});
