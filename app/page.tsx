'use client';
import { useEffect, useRef, useState } from 'react';
import { ScrollScene } from '@/components/scroll-scene';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
const projects = [
  {
    id: '01',
    name: 'Phú Hòa',
    line: 'Từ ảnh chụp thật đến hình ảnh bán hàng.',
    category: 'Website',
    type: 'Định hướng · Nội dung · Website',
    image: 'architecture',
    year: '2026',
    description:
      'VVT giữ nguyên sản phẩm và câu chuyện của thương hiệu, sau đó làm lại cách trình bày để khách hàng dễ hiểu, dễ tin và dễ liên hệ hơn.',
  },
  {
    id: '02',
    name: 'Đặng Thư',
    line: 'Một câu chuyện thủ công được kể đúng cách.',
    category: 'Website',
    type: 'Câu chuyện · Hình ảnh · Trải nghiệm số',
    image: 'interior',
    year: '2026',
    description:
      'Website dẫn người xem qua hành trình chọn bình, chọn nguyên liệu, điêu khắc và hoàn thiện. Tư liệu thật được sắp xếp thành một trải nghiệm có cảm xúc.',
  },
  {
    id: '03',
    name: 'VVT Review',
    line: 'Nội dung dài, nhịp kể rõ, nhận diện nhất quán.',
    category: 'Nội dung',
    type: 'Kịch bản · Hình ảnh · Tự động hóa',
    image: 'ocean',
    year: '2025',
    description:
      'Một quy trình nội dung được thiết kế để giữ chất kể chuyện, đồng thời giảm phần việc lặp lại từ kịch bản đến dựng và xuất bản.',
  },
  {
    id: '04',
    name: 'Ảnh sản phẩm',
    line: 'Không đổi sản phẩm. Chỉ thay cách nó được nhìn thấy.',
    category: 'Hình ảnh',
    type: 'Chỉnh ảnh · Bố cục · Trình bày',
    image: 'product',
    year: '2025',
    description:
      'Từ ảnh chụp tại xưởng, VVT làm sạch bối cảnh và đưa sản phẩm vào không gian phù hợp để tăng cảm nhận về chất lượng mà vẫn trung thực.',
  },
  {
    id: '05',
    name: 'Web doanh nghiệp',
    line: 'Thông tin cũ được sắp lại thành đường đi rõ ràng.',
    category: 'Website',
    type: 'Cấu trúc · Mobile · Tốc độ',
    image: 'desert',
    year: '2025',
    description:
      'Giữ dữ liệu và nền tảng SEO đang có, làm lại cấu trúc, hình ảnh và luồng liên hệ để website phục vụ việc bán hàng tốt hơn.',
  },
  {
    id: '06',
    name: 'Trợ lý AI',
    line: 'Tư vấn ngắn gọn, chuyển người thật đúng lúc.',
    category: 'Tự động hóa',
    type: 'Chatbot · Thu thập nhu cầu · Chuyển tiếp',
    image: 'botanical',
    year: '2025',
    description:
      'Trợ lý được xây theo dữ liệu và cách bán hàng của doanh nghiệp: hỏi vừa đủ, không đoán tồn kho và chuyển ngay khi khách cần người phụ trách.',
  },
];
const filters = ['Tất cả', 'Website', 'Hình ảnh', 'Nội dung', 'Tự động hóa'];
type Project = (typeof projects)[number];
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article className={`project-card card-${index % 2}`}>
        <button
          className="project-link"
          onClick={() => setOpen(true)}
          aria-label={`Xem dự án ${project.name}`}
        >
          <div className="image-frame">
            <div className="image-motion">
              <img
                src={`/images/${project.image}.jpg`}
                alt={`${project.name} — ${project.line}`}
                width="1200"
                height="900"
                loading={index < 2 ? 'eager' : 'lazy'}
              />
            </div>
            <span className="image-index">F—{project.id}</span>
            <span className="view-project">
              Xem dự án <span>↗</span>
            </span>
            <span className="image-wordmark">{project.name}</span>
          </div>
          <div className="card-caption">
            <div>
              <h2>{project.name}</h2>
              <p>{project.line}</p>
            </div>
            <span className="card-category">{project.category}</span>
            <span className="card-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
        </button>
      </article>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="project-dialog">
          <div className="detail-image">
            <img src={`/images/${project.image}.jpg`} alt={project.name} />
          </div>
          <div className="detail-body">
            <span className="eyebrow">DỰ ÁN VVT / {project.year}</span>
            <DialogTitle>{project.name}</DialogTitle>
            <DialogDescription>{project.description}</DialogDescription>
            <div className="detail-meta">
              <span>{project.type}</span>
              <span>VVT DIGITAL</span>
            </div>
            <p className="demo-note">Giải pháp được điều chỉnh theo dữ liệu và mục tiêu thực tế của từng doanh nghiệp.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default function Home() {
  const [filter, setFilter] = useState('Tất cả');
  const [filterOpen, setFilterOpen] = useState(false);
  const [contact, setContact] = useState(false);
  const [sent, setSent] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [menu, setMenu] = useState(false);
  const [motion, setMotion] = useState(true);
  const [draft, setDraft] = useState({ name: '', email: '', idea: '' });
  const sectionRef = useRef<HTMLElement>(null);
  const visible = projects.filter(
    (p) => filter === 'Tất cả' || p.category === filter,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!media.matches);
    update();
    media.addEventListener('change', update);
    try {
      const d = JSON.parse(localStorage.getItem('vvt-enquiry') || 'null');
      if (
        d &&
        typeof d.name === 'string' &&
        typeof d.email === 'string' &&
        typeof d.idea === 'string'
      )
        setDraft(d);
    } catch {}
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
  }, [motion]);
  function changeFilter(next: string) {
    const section = sectionRef.current;
    if (section && section.getBoundingClientRect().top < 0)
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY,
        behavior: 'instant',
      });
    setFilter(next);
    setFilterOpen(false);
  }
  function openContact() {
    setContact(true);
    setSent(false);
    setSaveError('');
  }
  return (
    <>
      <a className="skip-link" href="#work">
        Đi đến dự án
      </a>
      <header className="site-header">
        <a className="logo" href="#top" aria-label="Trang chủ VVT Digital">
          VVT<span>®</span>
        </a>
        <span className="header-caption">
          Website có chiều sâu.
          <br />
          Công nghệ vừa đủ.
        </span>
        <nav aria-label="Điều hướng chính">
          <a className="active" href="#work">
            Dự án <sup>06</sup>
          </a>
          <a href="#studio">Cách làm</a>
          <button onClick={openContact}>
            Trao đổi <span>↗</span>
          </button>
        </nav>
        <button
          className="menu-toggle"
          aria-expanded={menu}
          aria-label="Mở hoặc đóng menu"
          onClick={() => setMenu(!menu)}
        >
          {menu ? 'Đóng −' : 'Menu +'}
        </button>
      </header>
      {menu && (
        <nav className="mobile-menu" aria-label="Điều hướng di động">
          <a href="#work" onClick={() => setMenu(false)}>
            Dự án <sup>06</sup>
          </a>
          <a href="#studio" onClick={() => setMenu(false)}>
            Cách làm
          </a>
          <button
            onClick={() => {
              setMenu(false);
              openContact();
            }}
          >
            Trao đổi ↗
          </button>
        </nav>
      )}
      <main id="top">
        <section className="intro" aria-label="Giới thiệu">
          <div className="intro-kicker">
            <span className="status-dot" /> THIẾT KẾ LẠI WEBSITE CHO DOANH NGHIỆP VIỆT
          </div>
          <h1>
            Giữ điều đáng giá.
            <br />
            Làm lại điều <em>đã cũ.</em>
            <svg
              className="hero-asterisk"
              aria-hidden="true"
              viewBox="0 0 100 100"
            >
              <path d="M50 8v84M8 50h84M20 20l60 60M80 20L20 80" />
            </svg>
          </h1>
          <div className="intro-bottom">
            <p>
              VVT giữ lại dữ liệu, lịch sử và giá trị cũ.
              <br className="desktop-break" /> Sau đó làm lại cách khách hàng nhìn thấy chúng.
            </p>
            <a href="#work" className="scroll-cue">
              CUỘN ĐỂ XEM <span>↓</span>
            </a>
          </div>
        </section>
        <section
          id="work"
          className="work-section"
          ref={sectionRef}
          aria-labelledby="work-heading"
        >
          <ScrollScene motion={motion} resetKey={filter}>
            <div className="work-toolbar">
              <div className="work-heading">
                <span className="section-number">01 /</span>
                <h2 id="work-heading">
                  Dự án thực tế
                  <span className="heading-count">
                    ({String(visible.length).padStart(2, '0')})
                  </span>
                </h2>
              </div>
              <button
                className="mobile-filter"
                aria-expanded={filterOpen}
                aria-controls="project-filters"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                {filter === 'Tất cả' ? 'Lọc' : filter}{' '}
                <span>{filterOpen ? '−' : '+'}</span>
              </button>
              <div
                id="project-filters"
                className={`filters ${filterOpen ? 'is-open' : ''}`}
                aria-label="Lọc dự án"
              >
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => changeFilter(f)}
                    aria-pressed={filter === f}
                    className={filter === f ? 'selected' : ''}
                  >
                    {f}
                    <sup>{f === 'Tất cả' ? 6 : projects.filter((p) => p.category === f).length}</sup>
                  </button>
                ))}
              </div>
            </div>
            <p className="sr-only" role="status">
              Đang hiển thị {visible.length} dự án: {filter}
            </p>
            <div className="project-grid" key={filter}>
              {visible.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          </ScrollScene>
          <div className="work-end">
            <span>GIỮ CÁI TỐT. SỬA ĐIỀU CHƯA TỐT.</span>
            <span>2025 — 2026</span>
            <span>CÒN NHIỀU ĐIỀU ĐỂ LÀM ↗</span>
          </div>
        </section>
        <section className="studio" id="studio">
          <span className="eyebrow">02 / CÁCH VVT LÀM</span>
          <div>
            <h2>
              Không phá đi làm lại.
              <br />
              <em>Chỉ sửa đúng chỗ.</em>
            </h2>
            <p>
              VVT bắt đầu từ những gì doanh nghiệp đang có: website cũ, ảnh thật,
              sản phẩm và câu chuyện. Chúng tôi chẩn đoán phần đang cản khách hàng,
              giữ lại dữ liệu có giá trị rồi nâng cấp hình ảnh, trải nghiệm mobile,
              tốc độ và luồng liên hệ.
            </p>
            <div className="services">
              <span>01 · Chẩn đoán miễn phí</span>
              <span>02 · Giữ dữ liệu có giá trị</span>
              <span>03 · Thiết kế và xây dựng</span>
              <span>04 · Bàn giao và hỗ trợ</span>
            </div>
          </div>
        </section>
        <footer id="contact">
          <div className="footer-top">
            <span className="eyebrow">WEBSITE CỦA BẠN ĐANG CŨ?</span>
            <span className="availability">
              <span className="status-dot" /> NHẬN CHẨN ĐOÁN MIỄN PHÍ
            </span>
          </div>
          <button className="contact-cta" onClick={openContact}>
            Gửi website cũ.
            <br />
            <em>VVT xem giúp bạn.</em>
            <span>↗</span>
          </button>
          <div className="footer-bottom">
            <a className="logo" href="#top">
              VVT<span>®</span>
            </a>
            <span>© VVT DIGITAL 2026</span>
            <span>WEBSITE · HÌNH ẢNH · TỰ ĐỘNG HÓA</span>
            <button
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: motion ? 'smooth' : 'instant',
                })
              }
            >
              Lên đầu trang ↑
            </button>
          </div>
        </footer>
      </main>
      <button
        className="motion-toggle"
        onClick={() => setMotion(!motion)}
        aria-pressed={motion}
        aria-label={`Hiệu ứng ${motion ? 'đang bật' : 'đang tắt'}`}
      >
        <span aria-hidden="true">{motion ? 'Ⅱ' : '▷'}</span>
        <span>Hiệu ứng {motion ? 'bật' : 'tắt'}</span>
      </button>
      <Dialog open={contact} onOpenChange={setContact}>
        <DialogContent className="contact-dialog">
          <span className="eyebrow">BẮT ĐẦU TỪ WEBSITE ĐANG CÓ</span>
          <DialogTitle>VVT xem giúp bạn nhé?</DialogTitle>
          <DialogDescription>
            Gửi địa chỉ website và điều bạn đang thấy chưa ổn. VVT sẽ xem trước
            và phản hồi hướng xử lý phù hợp.
          </DialogDescription>
          {sent ? (
            <div className="form-success" role="status">
              <span>↗</span>
              <h3>Thông tin đã được lưu.</h3>
              <p>Bản này được giữ trên thiết bị để bạn có thể quay lại chỉnh sửa.</p>
              <button onClick={() => setSent(false)}>Chỉnh sửa</button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  localStorage.setItem('vvt-enquiry', JSON.stringify(draft));
                  setSent(true);
                } catch {
                  setSaveError(
                    'Trình duyệt không lưu được nội dung. Hãy sao chép lại trước khi đóng.',
                  );
                }
              }}
            >
              <label>
                Tên của bạn
                <input
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="Nguyễn Văn An"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </label>
              <label>
                Email hoặc số điện thoại
                <input
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  placeholder="ban@doanhnghiep.vn"
                  value={draft.email}
                  onChange={(e) =>
                    setDraft({ ...draft, email: e.target.value })
                  }
                />
              </label>
              <label>
                Website và điều bạn muốn cải thiện
                <textarea
                  name="idea"
                  required
                  rows={3}
                  placeholder="Ví dụ: tenmien.vn — ảnh sản phẩm cũ, xem trên điện thoại khó..."
                  value={draft.idea}
                  onChange={(e) => setDraft({ ...draft, idea: e.target.value })}
                />
              </label>
              {saveError && <p role="alert">{saveError}</p>}
              <button className="submit-button" type="submit">
                Lưu yêu cầu <span>↗</span>
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
